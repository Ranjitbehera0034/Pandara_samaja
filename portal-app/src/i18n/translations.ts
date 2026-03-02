// ─── i18n Translation System ────────────────────────────────────
// Supports: English (en) and Odia (od)

export type Language = 'en' | 'od';

export const translations = {
    // ═══════════════════════════════════════════
    //  COMMON / SHARED
    // ═══════════════════════════════════════════
    common: {
        appName: { en: 'Pandara', od: 'ପନ୍ଦରା' },
        appTagline: { en: 'SAMAJA PORTAL', od: 'ସମାଜ ପୋର୍ଟାଲ' },
        loading: { en: 'Loading...', od: 'ଲୋଡ ହେଉଛି...' },
        save: { en: 'Save', od: 'ସେଭ କରନ୍ତୁ' },
        cancel: { en: 'Cancel', od: 'ବାତିଲ କରନ୍ତୁ' },
        delete: { en: 'Delete', od: 'ଡିଲିଟ କରନ୍ତୁ' },
        edit: { en: 'Edit', od: 'ସମ୍ପାଦନ' },
        search: { en: 'Search', od: 'ସନ୍ଧାନ' },
        submit: { en: 'Submit', od: 'ଦାଖଲ କରନ୍ତୁ' },
        close: { en: 'Close', od: 'ବନ୍ଦ' },
        yes: { en: 'Yes', od: 'ହଁ' },
        no: { en: 'No', od: 'ନା' },
        logout: { en: 'Logout', od: 'ଲଗଆଉଟ' },
        collapse: { en: 'Collapse', od: 'ସଂକୁଚିତ' },
        expand: { en: 'Expand sidebar', od: 'ସାଇଡବାର ବଡ଼ କରନ୍ତୁ' },
        online: { en: 'Online', od: 'ଅନଲାଇନ' },
        offline: { en: 'Offline', od: 'ଅଫଲାଇନ' },
        language: { en: 'Language', od: 'ଭାଷା' },
        english: { en: 'English', od: 'ଇଂରାଜୀ' },
        odia: { en: 'ଓଡ଼ିଆ', od: 'ଓଡ଼ିଆ' },
    },

    // ═══════════════════════════════════════════
    //  NAVIGATION
    // ═══════════════════════════════════════════
    nav: {
        home: { en: 'Home', od: 'ମୂଳପୃଷ୍ଠା' },
        explore: { en: 'Explore', od: 'ଅନ୍ୱେଷଣ' },
        groups: { en: 'Groups', od: 'ସମୂହ' },
        events: { en: 'Events', od: 'କାର୍ଯ୍ୟକ୍ରମ' },
        messages: { en: 'Messages', od: 'ବାର୍ତ୍ତା' },
        notifications: { en: 'Notifications', od: 'ସୂଚନା' },
        members: { en: 'Members', od: 'ସଦସ୍ୟ' },
        gallery: { en: 'Gallery', od: 'ଗ୍ୟାଲେରୀ' },
        profile: { en: 'Profile', od: 'ପ୍ରୋଫାଇଲ' },
        settings: { en: 'Settings', od: 'ସେଟିଂସ' },
        searchPlaceholder: { en: 'Search people, posts, topics...', od: 'ଲୋକ, ପୋଷ୍ଟ, ବିଷୟ ସନ୍ଧାନ...' },
    },

    // ═══════════════════════════════════════════
    //  LOGIN PAGE
    // ═══════════════════════════════════════════
    login: {
        title: { en: 'Member Portal', od: 'ସଦସ୍ୟ ପୋର୍ଟାଲ' },
        subtitle: { en: 'Welcome back to Pandara Samaja', od: 'ପନ୍ଦରା ସମାଜକୁ ସ୍ୱାଗତ' },
        membershipNo: { en: 'Membership Number', od: 'ସଦସ୍ୟତା ନମ୍ବର' },
        mobileNo: { en: 'Mobile Number', od: 'ମୋବାଇଲ ନମ୍ବର' },
        membershipPlaceholder: { en: 'e.g. 123456789', od: 'ଯେପରିକି ୧୨୩୪୫୬୭୮୯' },
        mobilePlaceholder: { en: 'e.g. 9876543210', od: 'ଯେପରିକି ୯୮୭୬୫୪୩୨୧୦' },
        accessPortal: { en: 'Access Portal', od: 'ପୋର୍ଟାଲ ପ୍ରବେଶ' },
        notMember: { en: 'Not a member yet?', od: 'ଏପର୍ଯ୍ୟନ୍ତ ସଦସ୍ୟ ନୁହଁନ୍ତି?' },
        applyMembership: { en: 'Apply for Membership', od: 'ସଦସ୍ୟତା ପାଇଁ ଆବେଦନ' },
        bothRequired: { en: 'Please enter both Membership No. and Mobile Number', od: 'ଦୟାକରି ସଦସ୍ୟତା ନମ୍ବର ଓ ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ' },
    },

    // ═══════════════════════════════════════════
    //  FEED PAGE
    // ═══════════════════════════════════════════
    feed: {
        title: { en: 'Activity Feed', od: 'କାର୍ଯ୍ୟକଳାପ ଫିଡ' },
        subtitle: { en: 'Updates from your community', od: 'ଆପଣଙ୍କ ସମାଜର ଅପଡେଟ' },
        loadingFeed: { en: 'Loading feed', od: 'ଫିଡ ଲୋଡ ହେଉଛି' },
        noPosts: { en: 'No posts yet. Be the first to share something!', od: 'ଏପର୍ଯ୍ୟନ୍ତ କିଛି ପୋଷ୍ଟ ନାହିଁ। ପ୍ରଥମେ କିଛି ଶେୟାର କରନ୍ତୁ!' },
        newPostAvailable: { en: 'New post available!', od: 'ନୂଆ ପୋଷ୍ଟ ଉପଲବ୍ଧ!' },
        postCreated: { en: 'Post created!', od: 'ପୋଷ୍ଟ ତିଆରି ହେଲା!' },
        postCreatedOffline: { en: 'Post created (Offline mode)', od: 'ପୋଷ୍ଟ ତିଆରି ହେଲା (ଅଫଲାଇନ ମୋଡ)' },
        posting: { en: 'Posting...', od: 'ପୋଷ୍ଟ ହେଉଛି...' },
        storyAdded: { en: 'Story added to your timeline!', od: 'ଆପଣଙ୍କ ଟାଇମଲାଇନରେ ଷ୍ଟୋରୀ ଯୋଗ ହେଲା!' },
        commentAddedOffline: { en: 'Comment added (Offline mode)', od: 'ମନ୍ତବ୍ୟ ଯୋଗ ହେଲା (ଅଫଲାଇନ ମୋଡ)' },
    },

    // ═══════════════════════════════════════════
    //  CREATE POST
    // ═══════════════════════════════════════════
    createPost: {
        placeholder: { en: "What's happening in the community?", od: 'ସମାଜରେ କ\'ଣ ଚାଲିଛି?' },
        post: { en: 'Post', od: 'ପୋଷ୍ଟ' },
        addPhoto: { en: 'Photo', od: 'ଫଟୋ' },
        contentViolation: { en: 'Your post contains content that violates community guidelines. It will be blocked.', od: 'ଆପଣଙ୍କ ପୋଷ୍ଟ ସମାଜ ନୀତିନିୟମ ଉଲ୍ଲଂଘନ କରେ। ଏହା ବ୍ଲକ ହେବ।' },
    },

    // ═══════════════════════════════════════════
    //  POST CARD
    // ═══════════════════════════════════════════
    postCard: {
        like: { en: 'Like', od: 'ଲାଇକ' },
        comment: { en: 'Comment', od: 'ମନ୍ତବ୍ୟ' },
        share: { en: 'Share', od: 'ଶେୟାର' },
        report: { en: 'Report', od: 'ରିପୋର୍ଟ' },
        editPost: { en: 'Edit Post', od: 'ପୋଷ୍ଟ ସମ୍ପାଦନ' },
        deletePost: { en: 'Delete Post', od: 'ପୋଷ୍ଟ ଡିଲିଟ' },
        noComments: { en: 'No comments yet. Be the first!', od: 'ଏପର୍ଯ୍ୟନ୍ତ ମନ୍ତବ୍ୟ ନାହିଁ। ପ୍ରଥମ ହୁଅନ୍ତୁ!' },
        writeComment: { en: 'Write a comment...', od: 'ଗୋଟିଏ ମନ୍ତବ୍ୟ ଲେଖନ୍ତୁ...' },
        reportReason: { en: 'Why are you reporting this post? Select a reason:', od: 'ଆପଣ ଏହି ପୋଷ୍ଟ କାହିଁକି ରିପୋର୍ଟ କରୁଛନ୍ତି? କାରଣ ଚୟନ କରନ୍ତୁ:' },
        reportReasons: {
            spam: { en: 'Spam', od: 'ସ୍ପାମ' },
            inappropriate: { en: 'Inappropriate content', od: 'ଅନୁଚିତ ବିଷୟ' },
            harassment: { en: 'Harassment or bullying', od: 'ହଇରାଣ ବା ବୁଲିଂ' },
            falseInfo: { en: 'False information', od: 'ମିଥ୍ୟା ସୂଚନା' },
            other: { en: 'Other', od: 'ଅନ୍ୟ' },
        },
        submitReport: { en: 'Submit Report', od: 'ରିପୋର୍ଟ ଦାଖଲ' },
        justNow: { en: 'Just now', od: 'ଏବେ' },
        mAgo: { en: 'm ago', od: 'ମି. ପୂର୍ବେ' },
        hAgo: { en: 'h ago', od: 'ଘ. ପୂର୍ବେ' },
        dAgo: { en: 'd ago', od: 'ଦିନ ପୂର୍ବେ' },
    },

    // ═══════════════════════════════════════════
    //  STORIES
    // ═══════════════════════════════════════════
    stories: {
        addStory: { en: 'Add Story', od: 'ଷ୍ଟୋରୀ ଯୋଗ' },
        yourStory: { en: 'Your Story', od: 'ଆପଣଙ୍କ ଷ୍ଟୋରୀ' },
    },

    // ═══════════════════════════════════════════
    //  CHAT PAGE
    // ═══════════════════════════════════════════
    chat: {
        title: { en: 'Messages', od: 'ବାର୍ତ୍ତା' },
        searchConversations: { en: 'Search conversations...', od: 'ବାର୍ତ୍ତାଳାପ ସନ୍ଧାନ...' },
        noConversations: { en: 'No conversations yet', od: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ବାର୍ତ୍ତାଳାପ ନାହିଁ' },
        tapToStart: { en: 'to start chatting with a member', od: 'ଜଣେ ସଦସ୍ୟଙ୍କ ସହ ଚାଟ ଆରମ୍ଭ କରିବାକୁ' },
        startConversation: { en: 'Start a conversation', od: 'ବାର୍ତ୍ତାଳାପ ଆରମ୍ଭ କରନ୍ତୁ' },
        yourMessages: { en: 'Your Messages', od: 'ଆପଣଙ୍କ ବାର୍ତ୍ତା' },
        selectConversation: { en: 'Select a conversation or start a new one to chat with community members.', od: 'ସମାଜ ସଦସ୍ୟଙ୍କ ସହ ଚାଟ କରିବାକୁ ବାର୍ତ୍ତାଳାପ ଚୟନ କରନ୍ତୁ ବା ନୂଆ ଆରମ୍ଭ କରନ୍ତୁ।' },
        newConversation: { en: 'New Conversation', od: 'ନୂଆ ବାର୍ତ୍ତାଳାପ' },
        typeMessage: { en: 'Type a message...', od: 'ଏକ ବାର୍ତ୍ତା ଲେଖନ୍ତୁ...' },
        sayHelloTo: { en: 'Say hello to', od: 'ନମସ୍କାର କୁହନ୍ତୁ' },
        typing: { en: 'typing...', od: 'ଲେଖୁଛନ୍ତି...' },
        connected: { en: 'Connected', od: 'ସଂଯୁକ୍ତ' },
        disconnected: { en: 'Disconnected', od: 'ବିଚ୍ଛିନ୍ନ' },
        failedLoadMembers: { en: 'Failed to load members', od: 'ସଦସ୍ୟ ଲୋଡ ବିଫଳ' },
        failedLoadMessages: { en: 'Failed to load messages', od: 'ବାର୍ତ୍ତା ଲୋଡ ବିଫଳ' },
        failedSend: { en: 'Failed to send message', od: 'ବାର୍ତ୍ତା ପଠାଇବା ବିଫଳ' },
        sendMessage: { en: 'Send message', od: 'ବାର୍ତ୍ତା ପଠାନ୍ତୁ' },
        searchMembers: { en: 'Search members by name or ID...', od: 'ନାମ ବା ID ଦ୍ୱାରା ସନ୍ଧାନ...' },
        noMembersFound: { en: 'No members found', od: 'କୌଣସି ସଦସ୍ୟ ମିଳିଲା ନାହିଁ' },
        yesterday: { en: 'Yesterday', od: 'ଗତକାଲି' },
        lostConnection: { en: 'Lost connection to chat server', od: 'ଚାଟ ସର୍ଭର ସହ ସଂଯୋଗ ଛିନ୍ନ' },
        // Phase 3
        groups: { en: 'Groups', od: 'ଗ୍ରୁପ୍' },
        createGroup: { en: 'Create Group', od: 'ଗ୍ରୁପ୍ ତିଆରି' },
        groupName: { en: 'Group name', od: 'ଗ୍ରୁପ୍ ନାମ' },
        addMembers: { en: 'Add Members', od: 'ସଦସ୍ୟ ଯୋଡ଼ନ୍ତୁ' },
        create: { en: 'Create', od: 'ତିଆରି' },
        membersCount: { en: 'members', od: 'ସଦସ୍ୟ' },
        voiceMessage: { en: 'Voice message', od: 'ଧ୍ୱନି ବାର୍ତ୍ତା' },
        recording: { en: 'Recording...', od: 'ରେକର୍ଡିଂ...' },
        audioCall: { en: 'Audio Call', od: 'ଅଡିଓ କଲ' },
        videoCall: { en: 'Video Call', od: 'ଭିଡିଓ କଲ' },
        calling: { en: 'Calling...', od: 'କଲ କରୁଛନ୍ତି...' },
        incomingCall: { en: 'Incoming call', od: 'ଆସୁଥିବା କଲ' },
        endCall: { en: 'End Call', od: 'କଲ ସମାପ୍ତ' },
        callEnded: { en: 'Call ended', od: 'କଲ ସମାପ୍ତ ହେଲା' },
    },

    // ═══════════════════════════════════════════
    //  MEMBERS PAGE
    // ═══════════════════════════════════════════
    members: {
        title: { en: 'Member Directory', od: 'ସଦସ୍ୟ ତାଲିକା' },
        subtitle: { en: 'Connect with other community members', od: 'ଅନ୍ୟ ସମାଜ ସଦସ୍ୟଙ୍କ ସହ ସଂଯୋଗ' },
        searchMembers: { en: 'Search members...', od: 'ସଦସ୍ୟ ସନ୍ଧାନ...' },
        noMembers: { en: 'No members found matching your search.', od: 'ଆପଣଙ୍କ ସନ୍ଧାନ ସହ ମେଳ ଖାଉଥିବା ସଦସ୍ୟ ମିଳିଲା ନାହିଁ।' },
        subscribe: { en: 'Subscribe', od: 'ସବସ୍କ୍ରାଇବ' },
        unsubscribe: { en: 'Unsubscribe', od: 'ଅନସବସ୍କ୍ରାଇବ' },
        sendMessage: { en: 'Send message', od: 'ବାର୍ତ୍ତା ପଠାନ୍ତୁ' },
        familyMembers: { en: 'Family Members', od: 'ପରିବାର ସଦସ୍ୟ' },
        failedLoad: { en: 'Failed to load members directory', od: 'ସଦସ୍ୟ ତାଲିକା ଲୋଡ ବିଫଳ' },
        mobileNumber: { en: 'Mobile', od: 'ମୋବାଇଲ୍' },
        call: { en: 'Call', od: 'କଲ୍' },
        viewProfile: { en: 'View Profile', od: 'ପ୍ରୋଫାଇଲ୍ ଦେଖନ୍ତୁ' }
    },

    // ═══════════════════════════════════════════
    //  GALLERY PAGE
    // ═══════════════════════════════════════════
    gallery: {
        title: { en: 'My Gallery', od: 'ମୋ ଗ୍ୟାଲେରୀ' },
        subtitle: { en: 'Manage your personal photo collection', od: 'ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ଫଟୋ ସଂଗ୍ରହ ପରିଚାଳନା' },
        uploadPhotos: { en: 'Upload Photos', od: 'ଫଟୋ ଅପଲୋଡ' },
        dragDrop: { en: 'Click or drag photos here', od: 'ଫଟୋ ଏଠାରେ କ୍ଲିକ ବା ଡ୍ରାଗ କରନ୍ତୁ' },
        uploading: { en: 'Uploading...', od: 'ଅପଲୋଡ ହେଉଛି...' },
        supportsFormats: { en: 'Supports JPG, PNG, WEBP', od: 'JPG, PNG, WEBP ସମର୍ଥିତ' },
        noPhotos: { en: 'No photos yet', od: 'ଏପର୍ଯ୍ୟନ୍ତ ଫଟୋ ନାହିଁ' },
        uploadToShare: { en: 'Upload photos to share with the community', od: 'ସମାଜ ସହ ଶେୟାର କରିବାକୁ ଫଟୋ ଅପଲୋଡ କରନ୍ତୁ' },
        deleteConfirm: { en: 'Are you sure you want to delete this photo?', od: 'ଆପଣ ଏହି ଫଟୋ ଡିଲିଟ କରିବାକୁ ନିଶ୍ଚିତ?' },
        photoDeleted: { en: 'Photo deleted', od: 'ଫଟୋ ଡିଲିଟ ହେଲା' },
        failedLoad: { en: 'Failed to load your gallery', od: 'ଆପଣଙ୍କ ଗ୍ୟାଲେରୀ ଲୋଡ ବିଫଳ' },
        failedUpload: { en: 'Failed to upload photos', od: 'ଫଟୋ ଅପଲୋଡ ବିଫଳ' },
        failedDelete: { en: 'Could not delete photo', od: 'ଫଟୋ ଡିଲିଟ ହୋଇପାରିଲା ନାହିଁ' },
        successUpload: { en: 'Successfully uploaded', od: 'ସଫଳତାର ସହ ଅପଲୋଡ' },
        photos: { en: 'photo(s)', od: 'ଟି ଫଟୋ' },
        deletePhoto: { en: 'Delete photo', od: 'ଫଟୋ ଡିଲିଟ' },
    },

    // ═══════════════════════════════════════════
    //  PROFILE PAGE
    // ═══════════════════════════════════════════
    profile: {
        title: { en: 'My Profile', od: 'ମୋ ପ୍ରୋଫାଇଲ' },
        editProfile: { en: 'Edit Profile', od: 'ପ୍ରୋଫାଇଲ ସମ୍ପାଦନ' },
        saveChanges: { en: 'Save Changes', od: 'ପରିବର୍ତ୍ତନ ସେଭ' },
        saving: { en: 'Saving...', od: 'ସେଭ ହେଉଛି...' },
        personalInfo: { en: 'Personal Information', od: 'ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ' },
        name: { en: 'Name', od: 'ନାମ' },
        membershipNumber: { en: 'Membership Number', od: 'ସଦସ୍ୟତା ନମ୍ବର' },
        mobileNumber: { en: 'Mobile Number', od: 'ମୋବାଇଲ ନମ୍ବର' },
        aadharNo: { en: 'Aadhaar Number', od: 'ଆଧାର ନମ୍ବର' },
        address: { en: 'Address', od: 'ଠିକଣା' },
        district: { en: 'District', od: 'ଜିଲ୍ଲା' },
        taluka: { en: 'Taluka', od: 'ତାଲୁକ' },
        panchayat: { en: 'Panchayat', od: 'ପଞ୍ଚାୟତ' },
        village: { en: 'Village', od: 'ଗ୍ରାମ' },
        headGender: { en: 'Head Gender', od: 'ମୁଖ୍ୟ ଲିଙ୍ଗ' },
        male: { en: 'Male', od: 'ପୁରୁଷ' },
        female: { en: 'Female', od: 'ମହିଳା' },
        familyDetails: { en: 'Family Details', od: 'ପରିବାର ବିବରଣ' },
        familyMembers: { en: 'Family Members', od: 'ପରିବାର ସଦସ୍ୟ' },
        addFamilyMember: { en: 'Add Family Member', od: 'ପରିବାର ସଦସ୍ୟ ଯୋଗ' },
        relation: { en: 'Relation', od: 'ସମ୍ପର୍କ' },
        age: { en: 'Age', od: 'ବୟସ' },
        gender: { en: 'Gender', od: 'ଲିଙ୍ଗ' },
        changePhoto: { en: 'Change Photo', od: 'ଫଟୋ ବଦଳାନ୍ତୁ' },
        profileUpdated: { en: 'Profile updated successfully!', od: 'ପ୍ରୋଫାଇଲ ସଫଳତାର ସହ ଅପଡେଟ ହେଲା!' },
        failedUpdate: { en: 'Failed to update profile', od: 'ପ୍ରୋଫାଇଲ ଅପଡେଟ ବିଫଳ' },
        photoUploaded: { en: 'Profile photo updated!', od: 'ପ୍ରୋଫାଇଲ ଫଟୋ ଅପଡେଟ ହେଲା!' },
        failedPhotoUpload: { en: 'Failed to upload photo', od: 'ଫଟୋ ଅପଲୋଡ ବିଫଳ' },
    },

    // ═══════════════════════════════════════════
    //  NOTIFICATIONS PAGE
    // ═══════════════════════════════════════════
    notifications: {
        title: { en: 'Notifications', od: 'ସୂଚନା' },
        unreadNotifications: { en: 'unread notifications', od: 'ଅପଠିତ ସୂଚନା' },
        allCaughtUp: { en: 'All caught up!', od: 'ସବୁ ଦେଖିସାରିଲେ!' },
        markAllRead: { en: 'Mark all read', od: 'ସବୁ ପଢ଼ିଥିବା ଚିହ୍ନିତ' },
        all: { en: 'All', od: 'ସବୁ' },
        unread: { en: 'Unread', od: 'ଅପଠିତ' },
        noNotifications: { en: 'No notifications', od: 'କୌଣସି ସୂଚନା ନାହିଁ' },
        noUnread: { en: 'No unread notifications', od: 'କୌଣସି ଅପଠିତ ସୂଚନା ନାହିଁ' },
        markRead: { en: 'Mark read', od: 'ପଢ଼ିଥିବା ଚିହ୍ନିତ' },
        justNow: { en: 'Just now', od: 'ଏବେ' },
        // Notification types
        likedYourPost: { en: 'liked your post', od: 'ଆପଣଙ୍କ ପୋଷ୍ଟକୁ ଲାଇକ କଲେ' },
        commentedOn: { en: 'commented:', od: 'ମନ୍ତବ୍ୟ କଲେ:' },
        startedFollowing: { en: 'started following you', od: 'ଆପଣଙ୍କୁ ଅନୁସରଣ ଆରମ୍ଭ କଲେ' },
        mentionedYou: { en: 'mentioned you in a post', od: 'ଏକ ପୋଷ୍ଟରେ ଆପଣଙ୍କୁ ଉଲ୍ଲେଖ କଲେ' },
        likedStory: { en: 'liked your story', od: 'ଆପଣଙ୍କ ଷ୍ଟୋରୀକୁ ଲାଇକ କଲେ' },
        repliedComment: { en: 'replied to your comment', od: 'ଆପଣଙ୍କ ମନ୍ତବ୍ୟର ଉତ୍ତର ଦେଲେ' },
    },

    // ═══════════════════════════════════════════
    //  SETTINGS PAGE
    // ═══════════════════════════════════════════
    settings: {
        title: { en: 'Settings', od: 'ସେଟିଂସ' },
        subtitle: { en: 'Manage your account preferences and privacy', od: 'ଆପଣଙ୍କ ଆକାଉଣ୍ଟ ପସନ୍ଦ ଓ ଗୋପନୀୟତା ପରିଚାଳନା' },

        // Language section
        languageTitle: { en: 'Language / ଭାଷା', od: 'ଭାଷା / Language' },
        languageDesc: { en: 'Choose your preferred language', od: 'ଆପଣଙ୍କ ପସନ୍ଦର ଭାଷା ବାଛନ୍ତୁ' },

        // Content Safety
        contentSafety: { en: 'Content Safety', od: 'ବିଷୟବସ୍ତୁ ସୁରକ୍ଷା' },
        contentSafetyDesc: { en: 'Protect the community from inappropriate content', od: 'ସମାଜକୁ ଅନୁଚିତ ବିଷୟବସ୍ତୁରୁ ସୁରକ୍ଷା' },
        contentFilter: { en: 'Adult Content Filter', od: 'ବୟସ୍କ ବିଷୟ ଫିଲ୍ଟର' },
        contentFilterDesc: { en: 'Automatically detect and block adult/NSFW content from posts and images. Violating posts will be removed and the member will be warned.', od: 'ପୋଷ୍ଟ ଓ ଫଟୋରୁ ବୟସ୍କ/NSFW ବିଷୟ ସ୍ୱଚାଳିତ ଚିହ୍ନଟ ଓ ବ୍ଲକ। ଉଲ୍ଲଂଘନକାରୀ ପୋଷ୍ଟ ହଟାଯିବ ଓ ସଦସ୍ୟଙ୍କୁ ଚେତାବନୀ ଦିଆଯିବ।' },
        profanityFilter: { en: 'Profanity Filter', od: 'ଅଶ୍ଳୀଳ ଭାଷା ଫିଲ୍ଟର' },
        profanityFilterDesc: { en: 'Censor offensive or abusive language in posts and comments.', od: 'ପୋଷ୍ଟ ଓ ମନ୍ତବ୍ୟରେ ଆପତ୍ତିଜନକ ବା ଦୁର୍ବ୍ୟବହାରମୂଳକ ଭାଷା ସେନ୍ସର।' },

        // Privacy
        privacy: { en: 'Privacy', od: 'ଗୋପନୀୟତା' },
        privacyDesc: { en: 'Control who can see your information', od: 'କିଏ ଆପଣଙ୍କ ତଥ୍ୟ ଦେଖିପାରିବ ନିୟନ୍ତ୍ରଣ' },
        showOnline: { en: 'Show Online Status', od: 'ଅନଲାଇନ ସ୍ଥିତି ଦେଖାନ୍ତୁ' },
        showOnlineDesc: { en: 'Let others see when you are active on the portal.', od: 'ଆପଣ ପୋର୍ଟାଲରେ ସକ୍ରିୟ ଥିବାବେଳେ ଅନ୍ୟମାନଙ୍କୁ ଦେଖିବାକୁ ଦିଅନ୍ତୁ।' },
        readReceipts: { en: 'Read Receipts', od: 'ପଢ଼ିଥିବା ରସିଦ' },
        readReceiptsDesc: { en: 'Show others when you have read their messages.', od: 'ଆପଣ ସେମାନଙ୍କ ବାର୍ତ୍ତା ପଢ଼ିଥିବାବେଳେ ଦେଖାନ୍ତୁ।' },
        showAge: { en: 'Show Age on Profile', od: 'ପ୍ରୋଫାଇଲରେ ବୟସ ଦେଖାନ୍ତୁ' },
        showAgeDesc: { en: 'Display your age publicly on your profile page.', od: 'ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ ପୃଷ୍ଠାରେ ସର୍ବସାଧାରଣରେ ବୟସ ପ୍ରଦର୍ଶନ।' },
        showMobile: { en: 'Show Mobile Number', od: 'ମୋବାଇଲ ନମ୍ବର ଦେଖାନ୍ତୁ' },
        showMobileDesc: { en: 'Display your phone number on your public profile.', od: 'ଆପଣଙ୍କ ସର୍ବସାଧାରଣ ପ୍ରୋଫାଇଲରେ ଫୋନ ନମ୍ବର ପ୍ରଦର୍ଶନ।' },

        // Notifications
        notificationsTitle: { en: 'Notifications', od: 'ସୂଚନା' },
        notificationsDesc: { en: 'Choose what alerts you receive', od: 'କ\'ଣ ସୂଚନା ପାଇବେ ଚୟନ କରନ୍ତୁ' },
        likeNotif: { en: 'Like Notifications', od: 'ଲାଇକ ସୂଚନା' },
        likeNotifDesc: { en: 'Get notified when someone likes your post.', od: 'କେହି ଆପଣଙ୍କ ପୋଷ୍ଟକୁ ଲାଇକ କଲେ ସୂଚନା ପାଆନ୍ତୁ।' },
        commentNotif: { en: 'Comment Notifications', od: 'ମନ୍ତବ୍ୟ ସୂଚନା' },
        commentNotifDesc: { en: 'Get notified when someone comments on your post.', od: 'କେହି ଆପଣଙ୍କ ପୋଷ୍ଟରେ ମନ୍ତବ୍ୟ କଲେ ସୂଚନା ପାଆନ୍ତୁ।' },
        messageNotif: { en: 'Message Notifications', od: 'ବାର୍ତ୍ତା ସୂଚନା' },
        messageNotifDesc: { en: 'Get notified for new direct messages.', od: 'ନୂଆ ସିଧାସଳଖ ବାର୍ତ୍ତା ପାଇଁ ସୂଚନା ପାଆନ୍ତୁ।' },
        mentionNotif: { en: 'Mention Notifications', od: 'ଉଲ୍ଲେଖ ସୂଚନା' },
        mentionNotifDesc: { en: 'Get notified when someone mentions you.', od: 'କେହି ଆପଣଙ୍କୁ ଉଲ୍ଲେଖ କଲେ ସୂଚନା ପାଆନ୍ତୁ।' },
        communityNotif: { en: 'Community Updates', od: 'ସମାଜ ଅପଡେଟ' },
        communityNotifDesc: { en: 'Get notified about community events and announcements.', od: 'ସମାଜ ଅନୁଷ୍ଠାନ ଓ ଘୋଷଣା ବିଷୟରେ ସୂଚନା ପାଆନ୍ତୁ।' },

        // Appearance
        appearance: { en: 'Appearance', od: 'ଦୃଶ୍ୟ' },
        appearanceDesc: { en: 'Customize how the portal looks', od: 'ପୋର୍ଟାଲ ଦେଖାଯିବା ଧରଣ କଷ୍ଟମାଇଜ' },
        darkMode: { en: 'Dark Mode', od: 'ଡାର୍କ ମୋଡ' },
        darkModeDesc: { en: 'Use dark theme across the application.', od: 'ଆପ୍ଲିକେସନ ସାରା ଡାର୍କ ଥିମ ବ୍ୟବହାର।' },
        compactMode: { en: 'Compact Mode', od: 'କମ୍ପାକ୍ଟ ମୋଡ' },
        compactModeDesc: { en: 'Reduce spacing and font sizes for denser content view. Takes effect immediately.', od: 'ଘନ ବିଷୟ ଦୃଶ୍ୟ ପାଇଁ ବ୍ୟବଧାନ ଓ ଅକ୍ଷର ଆକାର ହ୍ରାସ। ସଙ୍ଗେ ସଙ୍ଗେ ପ୍ରଭାବ ପଡ଼ିବ।' },
        autoplayVideos: { en: 'Autoplay Videos', od: 'ସ୍ୱଚାଳିତ ଭିଡିଓ' },
        autoplayDesc: { en: 'Automatically play videos as you scroll through the feed.', od: 'ଫିଡ ସ୍କ୍ରୋଲ କରିବାବେଳେ ସ୍ୱଚାଳିତ ଭିଡିଓ ଚାଲନ।' },

        // About & Support
        aboutSupport: { en: 'About & Support', od: 'ବିଷୟ ଓ ସହାୟତା' },
        communityGuidelines: { en: 'Community Guidelines', od: 'ସମାଜ ନୀତିନିୟମ' },
        communityGuidelinesDesc: { en: 'Read our content policies and rules', od: 'ଆମ ବିଷୟ ନୀତି ଓ ନିୟମ ପଢ଼ନ୍ତୁ' },
        helpSupport: { en: 'Help & Support', od: 'ସାହାଯ୍ୟ ଓ ସହାୟତା' },
        helpSupportDesc: { en: 'Get help or report an issue', od: 'ସାହାଯ୍ୟ ପାଆନ୍ତୁ ବା ସମସ୍ୟା ରିପୋର୍ଟ' },
        privacyPolicy: { en: 'Privacy Policy', od: 'ଗୋପନୀୟତା ନୀତି' },
        privacyPolicyDesc: { en: 'How we handle your data', od: 'ଆମେ ଆପଣଙ୍କ ଡାଟା କିପରି ପରିଚାହିଁ' },

        // Danger Zone
        dangerZone: { en: 'Danger Zone', od: 'ବିପଦ ଅଞ୍ଚଳ' },
        logOut: { en: 'Log Out', od: 'ଲଗ ଆଉଟ' },
        deactivateAccount: { en: 'Deactivate Account', od: 'ଆକାଉଣ୍ଟ ନିଷ୍କ୍ରିୟ' },

        // Toggles
        enabled: { en: 'enabled', od: 'ସକ୍ରିୟ' },
        disabled: { en: 'disabled', od: 'ନିଷ୍କ୍ରିୟ' },

        // Footer
        version: { en: 'Pandara Samaja Portal v2.0 • Made with ❤️ for the community', od: 'ପନ୍ଦରା ସମାଜ ପୋର୍ଟାଲ v2.0 • ସମାଜ ପାଇଁ ❤️ ସହ ନିର୍ମିତ' },
    },

    // ═══════════════════════════════════════════
    //  MATRIMONY PAGE
    // ═══════════════════════════════════════════
    matrimony: {
        title: { en: 'Community Matrimony', od: 'ସମାଜ ବୈବାହିକ' },
        subtitle: { en: 'Find your forever', od: 'ଆପଣଙ୍କ ଜୀବନସାଥୀ ପାଆନ୍ତୁ' },
        tagline: { en: 'A dedicated space for members of our community to find meaningful connections and lifelong partnerships.', od: 'ଆମ ସମାଜର ସଦସ୍ୟମାନଙ୍କ ପାଇଁ ଅର୍ଥପୂର୍ଣ୍ଣ ସଂଯୋଗ ଏବଂ ଚିରସ୍ଥାୟୀ ସମ୍ପର୍କ ଖୋଜିବା ପାଇଁ ଏକ ସମର୍ପିତ ସ୍ଥାନ ।' },
        addProfile: { en: 'Add My Profile', od: 'ମୋ ପ୍ରୋଫାଇଲ୍ ଯୋଗ କରନ୍ତୁ' },
        getForm: { en: 'Get Form', od: 'ଫର୍ମ ପାଆନ୍ତୁ' },
        searchPlaceholder: { en: 'Search by name, education, or location...', od: 'ନାମ, ଶିକ୍ଷା ବା ସ୍ଥାନ ସନ୍ଧାନ...' },
        noProfiles: { en: 'No matching profiles', od: 'କୌଣସି ପ୍ରୋଫାଇଲ୍ ମିଳିଲା ନାହିଁ' },
        resetFilters: { en: 'Reset all filters', od: 'ସବୁ ଫିଲ୍ଟର ରିସେଟ୍' },
        verifiedMember: { en: 'Verified Member', od: 'ଯାଞ୍ଚ ହୋଇଥିବା ସଦସ୍ୟ' },
        fullDetails: { en: 'View Full Details', od: 'ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ' },
        partnerExpectations: { en: 'Partner Expectations', od: 'ଜୀବନସାଥୀ ଆଶା' },
        connectNow: { en: 'Connect Now', od: 'ଏବେ ସଂଯୋଗ କରନ୍ତୁ' },
        registerProfile: { en: 'Register Profile', od: 'ପ୍ରୋଫାଇଲ୍ ପଞ୍ଜିକରଣ' },
        uploadPhoto: { en: 'Upload Profile Photograph', od: 'ପ୍ରୋଫାଇଲ୍ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ' },
        uploadForm: { en: 'Upload Filled Form (Optional)', od: 'ପୂରଣ ହୋଇଥିବା ଫର୍ମ ଅପଲୋଡ୍ କରନ୍ତୁ (ବୈକଳ୍ପିକ)' },
        selectFile: { en: 'Select Image File', od: 'ଇମେଜ୍ ଫାଇଲ୍ ଚୟନ କରନ୍ତୁ' },
        fullName: { en: 'Full Name', od: 'ପୂରା ନାମ' },
        gender: { en: 'Gender', od: 'ଲିଙ୍ଗ' },
        dob: { en: 'Date of Birth', od: 'ଜନ୍ମ ତାରିଖ' },
        education: { en: 'Education', od: 'ଶିକ୍ଷା' },
        occupation: { en: 'Occupation', od: 'ପେଶା' },
        income: { en: 'Income / Height', od: 'ଆୟ / ଉଚ୍ଚତା' },
        fatherName: { en: "Father's Name", od: 'ପିତାଙ୍କ ନାମ' },
        mobileNumber: { en: 'Mobile Number', od: 'ମୋବାଇଲ୍ ନମ୍ବର' },
        address: { en: 'Permanent Address', od: 'ସ୍ଥାୟୀ ଠିକଣା' },
        expectations: { en: 'Partner Expectations', od: 'ଜୀବନସାଥୀ ଆଶା' },
        submitProfile: { en: 'Submit Profile', od: 'ପ୍ରୋଫାଇଲ୍ ଦାଖଲ' },
        all: { en: 'All', od: 'ସବୁ' },
        male: { en: 'Male', od: 'ପୁରୁଷ' },
        female: { en: 'Female', od: 'ମହିଳା' },
        age: { en: 'Age', od: 'ବୟସ' },
        years: { en: 'YEARS', od: 'ବର୍ଷ' },
        shortlist: { en: 'Shortlist', od: 'ପସନ୍ଦ' },
        shortlisted: { en: 'Shortlisted', od: 'ପସନ୍ଦ କରାଯାଇଛି' },
        candidatePortfolio: { en: 'Candidate Portfolio', od: 'ପ୍ରାର୍ଥୀ ପୋର୍ଟଫୋଲିଓ' },
    },
} as const;

// ─── Helper type for getting a translation value ─────
export type TranslationKey = keyof typeof translations;

// ─── Helper function ─────────────────────────────────
export function t(
    section: keyof typeof translations,
    key: string,
    lang: Language
): string {
    const sectionData = translations[section] as any;
    if (!sectionData || !sectionData[key]) return key;
    return sectionData[key][lang] || sectionData[key]['en'] || key;
}
