/**
 * @author ME Chamberlain
 */

/** The ID of the document that should be checked for changes. */
var docId = '';

/**
 * Sends an e-mail to all viewers of the `docId` document, if there have been
 * any changes/revisions to the document in the last hour.
 */
function sendDigestToContributors() {
  var to = '';
  var cc = '';
  var activeDocument = DocumentApp.openById(docId);
  // Get date/time 1 hour ago
  var now = new Date();
  var anHourAgo = new Date(now);
  anHourAgo.setHours(now.getHours() - 1);
  var revisions = getRevisions(activeDocument.getId(), anHourAgo);
  if (revisions.length == 0) {
    // No changes
    Logger.log('No changes in the last hour.');
    return;
  }
  // Build the message as a combination of the revisions
  // Also check whether all revisions were made by the same user.
  // If so, don't e-mail that user
  var body = 'Hello,\n\nThis relates to the following file on Google Drive: ' + activeDocument.getUrl() + '. The following revisions have been made:\n\n\n';
  var uniqueUser = true;
  var uniqueUserEmail = "";
  for (var i = 0; i < revisions.length; ++i) {
    var revision = revisions[i];
    body += 'Modified Date: ' + new Date(revision.modifiedDate).toLocaleString() + '\n';
    body += 'Modified by: ' + revision.lastModifyingUserName + '\n\n';
    var lastModifyingUserEmail = revision.lastModifyingUser.emailAddress;
    if (uniqueUser && lastModifyingUserEmail != uniqueUserEmail) {
      if (uniqueUserEmail == "") {
        uniqueUserEmail = lastModifyingUserEmail;
      }
      else {
        uniqueUser = false;
        uniqueUserEmail = "";
      }
    }
  }
  // Get the e-mail addresses of all contributors
  var viewers = activeDocument.getViewers();
  for (var i = 0; i < viewers.length; ++i) {
    var viewer = viewers[i];
    var email = viewer.getEmail()
    if (uniqueUser && email == uniqueUserEmail) {
      // Don't email the user that made the changes if all changes were made
      // by only one user
      continue;
    }
    if (to == '') {
      to = email
    }
    else {
      cc += email + ', '
    }
  }
  MailApp.sendEmail({
    to: to,
    cc: cc,
    subject: 'Updates to Google Drive Document: ' + activeDocument.getName(),
    body: body
  });
}

/**
 * Gets the revisions of `fileId` that have changed since the date `since`.
 * @param fileId The ID string of the file on Google Drive
 * @param since The Date since when to check for revisions
 * @return revisions An array of Drive.Revision objects, or an empty array if there were no revisions.
 */
function getRevisions(fileId, since) {
  var revisionsSince = [];
  var revisions = Drive.Revisions.list(fileId);
  if (revisions.items && revisions.items.length > 0) {
    for (var i = 0; i < revisions.items.length; i++) {
      var revision = revisions.items[i];
      var date = new Date(revision.modifiedDate);
      if (date >= since) {
        revisionsSince.push(revision);
        Logger.log('Date: %s, File size (bytes): %s', date.toLocaleString(), revision.fileSize);
      }
    }
  } else {
    Logger.log('No revisions found.');
  }
  return revisionsSince;
}
