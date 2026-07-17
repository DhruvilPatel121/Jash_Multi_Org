const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Deletes a user from Firebase Authentication and their record from the Realtime Database.
 * This function can only be called by an authenticated user who is an admin.
 */
exports.deleteDoctor = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check: Ensure the user calling the function is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to call this function."
    );
  }

  // 2. Admin Role Check: Ensure the user is an admin.
  const callerUid = context.auth.uid;
  const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
  const caller = callerSnap.val();

  if (caller.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be an admin to delete a doctor."
    );
  }

  // 3. UID Check: Ensure the UID of the doctor to delete was provided.
  const doctorUid = data.uid;
  if (!doctorUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid' argument."
    );
  }

  try {
    // 4. Perform Deletion
    // Delete from Firebase Authentication
    await admin.auth().deleteUser(doctorUid);
    console.log(`Successfully deleted user ${doctorUid} from Authentication.`);

    // Delete from Realtime Database
    const dbRef = admin.database().ref(`/users/${doctorUid}`);
    await dbRef.remove();
    console.log(`Successfully deleted user ${doctorUid} from Realtime Database.`);

    return { success: true, message: `Doctor with UID ${doctorUid} has been deleted.` };

  } catch (error) {
    console.error(`Failed to delete doctor ${doctorUid}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while trying to delete the doctor.",
      error
    );
  }
});
