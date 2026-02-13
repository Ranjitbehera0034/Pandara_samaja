/**
 * ============================================================
 *  PANDARA SAMAJA — Auto-Create Google Form
 * ============================================================
 *  
 *  HOW TO USE:
 *  1. Go to https://script.google.com
 *  2. Click "+ New project"
 *  3. Delete everything in the editor
 *  4. Paste this entire script
 *  5. Click "Run" (▶️ button at top)
 *  6. It will ask for permissions — click "Review Permissions" → 
 *     select your Google account → "Allow"
 *  7. Check the "Execution log" at the bottom for your Form URL and Sheet ID
 *
 * ============================================================
 */

function createPandaraSamajaForm() {

    // ---- 1. Create the Form ----
    var form = FormApp.create('Pandara Samaja — Member Details Form');
    form.setDescription(
        'ନିଖିଳ ଓଡିଶା ପନ୍ଦରା ସମାଜ — Member Registration Form\n\n' +
        'ଦୟାକରି ଆପଣଙ୍କ ପରିବାରର ସଠିକ ବିବରଣୀ ଦିଅନ୍ତୁ ।\n' +
        'Please fill in your family details accurately.\n\n' +
        '⚠️ All fields marked with * are required.'
    );
    form.setConfirmationMessage(
        'ଧନ୍ୟବାଦ! ଆପଣଙ୍କ ତଥ୍ୟ ସଫଳ ଭାବରେ ଦାଖଲ ହୋଇଛି ।\n' +
        'Thank you! Your details have been submitted successfully.\n\n' +
        'Our admin team will review and verify your submission.'
    );

    // ---- 2. Add Form Questions (ORDER MATTERS — must match FORM_COLUMNS in admin.js) ----

    // Q1: Membership No. (Column B = index 1)
    form.addTextItem()
        .setTitle('Membership No. (ସଦସ୍ୟ ସଂଖ୍ୟା)')
        .setHelpText('Enter your membership number exactly as given to you')
        .setRequired(true);

    // Q2: Head of Family Name (Column C = index 2)
    form.addTextItem()
        .setTitle('Head of Family Name (ପରିବାର ମୁଖ୍ୟଙ୍କ ନାମ)')
        .setHelpText('Enter full name of the head of the family')
        .setRequired(true);

    // Q3: Mobile Number (Column D = index 3)
    form.addTextItem()
        .setTitle('Mobile Number (ମୋବାଇଲ ନମ୍ବର)')
        .setHelpText('Enter 10-digit mobile number')
        .setRequired(true)
        .setValidation(FormApp.createTextValidation()
            .setHelpText('Please enter a valid 10-digit mobile number')
            .requireTextMatchesPattern('^[0-9]{10}$')
            .build());

    // Q4: District (Column E = index 4)
    form.addListItem()
        .setTitle('District (ଜିଲ୍ଲା)')
        .setRequired(true)
        .setChoiceValues([
            'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak',
            'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati',
            'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi',
            'Kandhamal', 'Kendrapara', 'Keonjhar', 'Khordha', 'Koraput',
            'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada',
            'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
        ]);

    // Q5: Taluka / Block (Column F = index 5)
    form.addTextItem()
        .setTitle('Taluka / Block (ତାଳୁକା / ବ୍ଲକ)')
        .setRequired(true);

    // Q6: Panchayat (Column G = index 6)
    form.addTextItem()
        .setTitle('Panchayat (ପଞ୍ଚାୟତ)')
        .setRequired(false);

    // Q7: Village (Column H = index 7)
    form.addTextItem()
        .setTitle('Village (ଗ୍ରାମ)')
        .setRequired(false);

    // Q8: Total Male Members (Column I = index 8)
    form.addTextItem()
        .setTitle('Total Male Members (ମୋଟ ପୁରୁଷ ସଦସ୍ୟ)')
        .setHelpText('Enter the number of male family members')
        .setRequired(true)
        .setValidation(FormApp.createTextValidation()
            .setHelpText('Please enter a number')
            .requireNumber()
            .build());

    // Q9: Total Female Members (Column J = index 9)
    form.addTextItem()
        .setTitle('Total Female Members (ମୋଟ ମହିଳା ସଦସ୍ୟ)')
        .setHelpText('Enter the number of female family members')
        .setRequired(true)
        .setValidation(FormApp.createTextValidation()
            .setHelpText('Please enter a number')
            .requireNumber()
            .build());

    // Q10: Family Member Names & Relations (Column K = index 10)
    form.addParagraphTextItem()
        .setTitle('Family Member Names & Relations (ପରିବାର ସଦସ୍ୟଙ୍କ ନାମ ଓ ସମ୍ପର୍କ)')
        .setHelpText(
            'List all family members with their relation to the head.\n' +
            'Example:\n' +
            'Ramesh Behera - Self (ନିଜ)\n' +
            'Sita Behera - Wife (ପତ୍ନୀ)\n' +
            'Raju Behera - Son (ପୁଅ)\n' +
            'Rani Behera - Daughter (ଝିଅ)'
        )
        .setRequired(true);

    // Q11: Head of Family Photo (Column L = index 11)
    // Note: File upload can't be added via script — using text URL instead.
    // You can manually change this to "File Upload" in the Google Forms editor later.
    form.addTextItem()
        .setTitle('Head of Family Photo URL (ପରିବାର ମୁଖ୍ୟଙ୍କ ଫଟୋ ଲିଙ୍କ)')
        .setHelpText('Paste a link to your photo (Google Drive / WhatsApp photo link), OR leave blank and admin will add later.\n\nTo upload via Google Drive: upload photo to drive.google.com → right-click → Get link → paste here.')
        .setRequired(false);


    // ---- 3. Link to Google Sheet ----
    var ss = SpreadsheetApp.create('Pandara Samaja — Form Responses');
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());


    // ---- 4. Publish the Sheet to web (for the admin panel to read) ----
    // Note: Publishing to web requires manual step, but we'll output instructions


    // ---- 5. Output all the links ----
    var formUrl = form.getPublishedUrl();
    var editUrl = form.getEditUrl();
    var sheetUrl = ss.getUrl();
    var sheetId = ss.getId();

    Logger.log('');
    Logger.log('========================================');
    Logger.log('✅ FORM CREATED SUCCESSFULLY!');
    Logger.log('========================================');
    Logger.log('');
    Logger.log('📝 Form URL (share with members):');
    Logger.log(formUrl);
    Logger.log('');
    Logger.log('✏️ Form Edit URL (for you to modify):');
    Logger.log(editUrl);
    Logger.log('');
    Logger.log('📊 Google Sheet URL:');
    Logger.log(sheetUrl);
    Logger.log('');
    Logger.log('🔑 SHEET ID (paste this in Admin Panel):');
    Logger.log(sheetId);
    Logger.log('');
    Logger.log('========================================');
    Logger.log('⚠️ IMPORTANT: You must still PUBLISH the sheet to web:');
    Logger.log('1. Open the Sheet URL above');
    Logger.log('2. Go to File → Share → Publish to web');
    Logger.log('3. Click "Publish"');
    Logger.log('4. Then paste the Sheet ID in your Admin Panel');
    Logger.log('========================================');

    // Also show as popup
    var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;

    return {
        formUrl: formUrl,
        editUrl: editUrl,
        sheetUrl: sheetUrl,
        sheetId: sheetId
    };
}
