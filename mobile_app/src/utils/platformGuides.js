export const platformGuides = {
  facebook: {
    title: 'Connect Facebook Messenger',
    summary: 'Connect a Facebook Page so Page messages can arrive in Unified and receive replies from the inbox.',
    prerequisites: [
      'You must manage a Facebook Page, not only a personal Facebook profile.',
      'The Page must be available to the Facebook account you use during sign-in.',
      'The app owner must complete Meta app review before real customers outside the app team can use the integration.',
    ],
    steps: [
      'Tap Connect and sign in with the Facebook account that manages the Page.',
      'Approve the requested Page messaging permissions and select the Page when Meta asks.',
      'Send a test message to the Page from a different Facebook account.',
      'Open Unified Inbox and confirm the message appears, then reply from the conversation.',
    ],
    limitation: 'Messenger replies are governed by Meta messaging windows. A customer should message the Page first before you reply.',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform/',
  },
  instagram: {
    title: 'Connect Instagram messages',
    summary: 'Instagram messaging requires a Professional Instagram account linked to a Facebook Page.',
    prerequisites: [
      'Switch the Instagram account to a Business or Creator account.',
      'Link that Instagram account to a Facebook Page you manage.',
      'In Instagram settings, allow connected tools to access messages.',
      'The app owner must complete Meta app review for production access.',
    ],
    steps: [
      'Finish the Instagram and Facebook Page linking steps before tapping Connect.',
      'Tap Connect and sign in with the Facebook account that manages the linked Page.',
      'Approve Instagram messaging and Page permissions in Meta’s sign-in screen.',
      'Send a test DM to the Instagram Professional account from another Instagram account.',
      'Open Unified Inbox and reply to the DM from the conversation.',
    ],
    limitation: 'Instagram conversations start when the customer messages the Professional account. Consumer/personal Instagram accounts are not supported.',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform/instagram',
  },
  whatsapp: {
    title: 'Connect WhatsApp Business',
    summary: 'WhatsApp must be connected through the WhatsApp Business Platform Cloud API, not a normal personal WhatsApp account.',
    prerequisites: [
      'Create or access a Meta Business Portfolio and WhatsApp Business Account.',
      'Have a business phone number registered for the Cloud API.',
      'For the current testing flow, prepare a system-user access token, Phone Number ID, and WhatsApp Business Account ID.',
      'For production self-onboarding, use Meta Embedded Signup instead of asking customers to paste tokens.',
    ],
    steps: [
      'For a test connection, copy the Cloud API access token from Meta’s WhatsApp API Setup screen.',
      'Copy the Phone Number ID and WhatsApp Business Account ID from the same Meta business setup.',
      'Tap Connect and enter those three values. Unified verifies the phone number before saving encrypted credentials.',
      'Send a WhatsApp message to the connected business number from a test phone number.',
      'Confirm the message appears in Unified Inbox and reply from the conversation.',
    ],
    limitation: 'Outside WhatsApp’s customer-care window, outbound messages generally require an approved template. Do not use the regular WhatsApp app token or a personal number for this flow.',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
  },
  telegram: {
    title: 'Connect Telegram',
    summary: 'Telegram connects through a bot. Unified receives messages sent to that bot and replies as the bot.',
    prerequisites: [
      'Create a Telegram bot with @BotFather and keep its bot token private.',
      'The deployed API must have a public HTTPS URL so Telegram can deliver webhook updates.',
      'Customers must open the bot and send a message before Unified can receive the conversation.',
    ],
    steps: [
      'Open Telegram, start a chat with @BotFather, and run /newbot.',
      'Copy the token returned by BotFather, then tap Connect in Unified.',
      'Paste the bot token. Unified verifies it with getMe and registers the webhook automatically.',
      'Open the bot link, tap Start, and send a test message.',
      'Open Unified Inbox and reply. The reply is sent through Telegram as the bot.',
    ],
    limitation: 'A Telegram bot cannot read arbitrary private chats. It only receives updates from chats where the bot is present and permitted to receive messages.',
    docsUrl: 'https://core.telegram.org/bots/api',
  },
  tiktok: {
    title: 'TikTok messaging',
    summary: 'TikTok profile connection is listed in the app, but customer messaging is not enabled in the current Unified integration.',
    prerequisites: ['TikTok Business API access and an approved messaging use case are required.'],
    steps: ['Do not enter TikTok credentials in Unified yet.', 'Use Facebook, Instagram, WhatsApp, or Telegram for the supported inbox experience.'],
    limitation: 'This channel is intentionally not presented as a working messaging integration yet.',
    docsUrl: 'https://developers.tiktok.com/doc/overview',
  },
  twitter: {
    title: 'X messaging',
    summary: 'X profile connection is listed in the app, but direct-message ingestion and replies are not enabled in the current Unified integration.',
    prerequisites: ['Approved X API access for direct messages is required.'],
    steps: ['Do not enter X credentials in Unified yet.', 'Use one of the four supported messaging channels for the current inbox workflow.'],
    limitation: 'This channel is intentionally not presented as a working messaging integration yet.',
    docsUrl: 'https://developer.x.com/en/docs/x-api',
  },
};

export const allPlatformGuide = {
  title: 'Connect your messaging channels',
  summary: 'Unified is a server-backed inbox. You connect each provider once, the provider sends new messages to our HTTPS webhook, and the app uses the saved connection to reply.',
  prerequisites: [
    'Use the Connect tab in the mobile app; never paste credentials into chat or send them to another person.',
    'Meta channels need a verified business/app setup and production permissions before other customers can use them.',
    'Telegram and Meta webhooks need a deployed API with a valid HTTPS certificate.',
  ],
  steps: [
    'Set up the provider account first: Facebook Page, Instagram Professional account, WhatsApp Cloud API, or Telegram bot.',
    'Tap the matching Connect button and complete the provider-specific sign-in or credential flow.',
    'Send a new test message from a different customer account. Existing old messages may not be imported automatically.',
    'Confirm the conversation appears in Home/Inbox, open it, and send a short reply.',
    'If a channel fails, check the provider prerequisites and contact support with the channel name and exact error—not the access token.',
  ],
  limitation: 'Each channel has its own rules for who can be messaged, how long replies are allowed, and which account types are supported.',
};
