# Multi-Organization Migration Plan

## Overview
This document outlines the strategy to add multi-organization support to the Jash Physio application without disrupting the existing live system.

## Current Architecture Analysis

### Existing Data Structure
```
firebase/
├── users/
│   └── {uid}/
│       ├── uid
│       ├── email
│       ├── name
│       ├── role (doctor|staff|admin)
│       ├── createdAt
│       └── sessionId
├── patients/
│   └── {patientId}/
│       └── [all patient data]
├── caseNotes/
│   └── {caseNoteId}/
│       └── [all case note data]
└── [other collections...]
```

### Current Authentication
- Firebase Authentication (email/password)
- Session-based single login enforcement
- Role-based access (doctor, staff, admin)

## Proposed Multi-Organization Architecture

### Option 1: Organization-Based Data Partitioning (RECOMMENDED)

#### New Data Structure
```
firebase/
├── organizations/
│   └── {orgId}/
│       ├── id
│       ├── name
│       ├── createdAt
│       └── settings
├── users/
│   └── {uid}/
│       ├── uid
│       ├── email
│       ├── name
│       ├── role (doctor|staff|admin)
│       ├── organizationId
│       ├── createdAt
│       └── sessionId
├── patients/
│   └── {orgId}/
│       └── {patientId}/
│           └── [all patient data]
├── caseNotes/
│   └── {orgId}/
│       └── {caseNoteId}/
│           └── [all case note data]
└── [other collections]/
    └── {orgId}/
        └── [data]
```

#### Key Features
- Existing data remains at root level (backward compatible)
- New organizations get their own partitioned data
- Users can belong to one organization
- Data isolation at collection level
- Firebase Security Rules for organization isolation

#### Migration Strategy
1. **Phase 1: Add Organization Support (No Data Migration)**
   - Add `organizations` collection
   - Add `organizationId` to User type
   - Update AuthContext to handle organizationId
   - Create organization selection UI
   - All existing users and data remain at root level

2. **Phase 2: Backward Compatibility Layer**
   - Update Firebase services to check for organizationId
   - If organizationId exists, use partitioned path
   - If no organizationId, use root path (existing behavior)
   - This ensures existing system continues to work

3. **Phase 3: Gradual Migration**
   - Create migration script to move existing data to organization partition
   - Run migration when client is ready
   - Update organizationId for existing users
   - Verify data integrity

4. **Phase 4: Remove Backward Compatibility**
   - After successful migration, remove root-level access
   - All data now organization-isolated

### Option 2: Firebase Project Per Organization (ALTERNATIVE)

#### Architecture
- Each organization gets its own Firebase project
- Shared frontend code
- Environment variables determine which Firebase config to use
- Complete data isolation at Firebase level

#### Pros
- Complete data isolation
- Separate billing per organization
- No data migration needed
- Firebase Security Rules per project

#### Cons
- Multiple Firebase projects to manage
- Higher cost (each project has free tier limits)
- More complex deployment
- Harder to share code/features

## Recommended Approach: Option 1

### Implementation Steps

### Step 1: Update Type Definitions
Add organization-related types:

```typescript
// src/types/index.ts
export interface Organization {
  id: string;
  name: string;
  createdAt: number;
  settings?: {
    [key: string]: any;
  };
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string; // NEW - optional for backward compatibility
  createdAt: number;
  sessionId?: string;
}
```

### Step 2: Update Firebase Services
Add organization-aware path helpers:

```typescript
// src/services/firebase.ts
const getOrgPath = (orgId: string | undefined, path: string) => {
  if (!orgId) return path; // Backward compatibility
  return `organizations/${orgId}/${path}`;
};

export const getPatient = async (patientId: string, orgId?: string): Promise<Patient | null> => {
  const basePath = getOrgPath(orgId, 'patients');
  const patientRef = ref(database, `${basePath}/${patientId}`);
  const snapshot = await get(patientRef);
  return snapshot.exists() ? snapshot.val() : null;
};
```

### Step 3: Update AuthContext
Add organization selection:

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  organization: Organization | null; // NEW
  organizations: Organization[]; // NEW
  selectOrganization: (orgId: string) => Promise<void>; // NEW
  // ... existing methods
}
```

### Step 4: Create Organization Management
- Organization creation page (admin only)
- Organization selection UI on login
- Organization settings page

### Step 5: Firebase Security Rules
Add organization-based access control:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Organizations collection
    match /organizations/{orgId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      
      // Organization-specific data
      match /patients/{patientId} {
        allow read, write: if request.auth != null 
          && request.auth.token.organizationId == orgId;
      }
      
      match /caseNotes/{caseNoteId} {
        allow read, write: if request.auth != null 
          && request.auth.token.organizationId == orgId;
      }
    }
    
    // Backward compatibility - root level access
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 6: Migration Script
Create script to migrate existing data:

```typescript
// scripts/migrate-to-organization.ts
async function migrateToOrganization(orgId: string) {
  // 1. Create organization
  await createOrganization(orgId, "Default Organization");
  
  // 2. Migrate patients
  const patients = await getAllPatients();
  for (const patient of patients) {
    await createPatientInOrg(orgId, patient);
  }
  
  // 3. Migrate case notes
  const caseNotes = await getAllCaseNotes();
  for (const note of caseNotes) {
    await createCaseNoteInOrg(orgId, note);
  }
  
  // 4. Update users with organizationId
  const users = await getAllUsers();
  for (const user of users) {
    await updateUser(user.uid, { organizationId: orgId });
  }
  
  // 5. Verify migration
  // Compare counts before/after
}
```

## Migration Timeline

### Phase 1: Foundation (1-2 weeks)
- Add organization types
- Update Firebase services with backward compatibility
- Create organization management UI
- Test with existing system (no organizationId)

### Phase 2: Organization Support (1 week)
- Implement organization selection
- Add organization creation
- Test multi-organization flow
- Deploy to staging

### Phase 3: Production Deployment (1 day)
- Deploy to production
- Existing system continues to work (no organizationId)
- New organizations can be created
- Monitor for issues

### Phase 4: Data Migration (Client Schedule)
- Schedule migration window with client
- Backup existing data
- Run migration script
- Verify data integrity
- Update user organizationIds
- Test migrated system

### Phase 5: Cleanup (1 week)
- Remove backward compatibility after verification
- Update Firebase security rules
- Monitor performance

## Risk Mitigation

### Data Safety
- Complete backup before migration
- Migration script with rollback capability
- Dry-run mode to test migration
- Verification after each step

### Zero Downtime
- Backward compatibility ensures existing system works
- Gradual migration approach
- Can rollback at any point
- No breaking changes to existing API

### Testing Strategy
- Unit tests for new organization logic
- Integration tests for backward compatibility
- Manual testing with existing data
- Load testing with migrated data

## Rollback Plan

If migration fails:
1. Stop migration script
2. Restore from backup
3. Remove organizationId from users
4. System returns to previous state

## Cost Considerations

### Option 1 (Recommended)
- No additional Firebase costs
- Single Firebase project
- Same authentication limits
- No additional infrastructure

### Option 2 (Alternative)
- Multiple Firebase projects = multiple free tiers
- Higher cost if organizations exceed free tier
- More complex billing management

## Recommendations

1. **Use Option 1** (Organization-based partitioning)
2. **Implement backward compatibility** first
3. **Deploy to production** before migrating data
4. **Schedule migration** with client during low-traffic period
5. **Test thoroughly** at each phase
6. **Have rollback plan** ready
7. **Monitor closely** after migration

## Next Steps

1. Review this plan with stakeholders
2. Get approval from client
3. Schedule migration window
4. Begin Phase 1 implementation
5. Create detailed test plan
6. Set up monitoring/alerting
