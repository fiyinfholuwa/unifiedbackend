# Unified social-channel integration guide

This guide explains how Unified receives and replies to customer messages from Facebook Messenger, Instagram, WhatsApp Business, and Telegram.

The mobile app is only the operator interface. Provider credentials stay on the Laravel API. Providers send inbound events to the API webhooks, the API stores normalized conversations/messages, and the mobile app reads and replies through authenticated API endpoints.

## What is supported now

| Channel | Connection in the app | Inbound messages | Replies | Account required |
| --- | --- | --- | --- | --- |
| Facebook | Facebook OAuth | Meta webhook | Messenger Send API | Facebook Page |
| Instagram | Facebook OAuth for a linked Page | Meta webhook | Instagram messaging endpoint | Instagram Professional account linked to a Page |
| WhatsApp | Meta Embedded Signup in production; credential fallback for testing | WhatsApp webhook | Cloud API `/messages` endpoint | WhatsApp Business Account and Cloud API phone number |
| Telegram | BotFather token | Telegram webhook | Bot API `sendMessage` | Telegram bot |

TikTok and X are listed in the mobile catalog but are not working messaging integrations yet. They should not be marketed as supported until their provider approval, webhook, inbound, and outbound flows are implemented.

## Required architecture

```text
Customer -> provider -> public HTTPS webhook -> Laravel API -> database
                                                   ^
Mobile app -> authenticated API -> Laravel API ----+
```

Do not call Meta or Telegram directly from React Native with a provider token. A mobile token can be extracted from an installed app. The API is the only place that should hold provider access tokens and app secrets.

## Deployment prerequisites

Before testing a real customer message:

1. Deploy the Laravel API on a stable public HTTPS domain.
2. Set `APP_URL` to that HTTPS domain. Telegram rejects webhook URLs that are not public HTTPS URLs.
3. Set `META_APP_SECRET` and `META_WEBHOOK_VERIFY_TOKEN` on the server only.
4. Set `META_GRAPH_API_VERSION` to the Graph API version supported by the Meta app. The code now reads this from configuration instead of forcing a version in application logic.
5. Configure the mobile app with `EXPO_PUBLIC_API_URL=https://your-domain.example/unified-api/v1` and rebuild the app.
6. Confirm the API can receive `GET` and `POST` requests at:
   - `https://your-domain.example/unified-api/v1/webhooks/meta`
   - `https://your-domain.example/unified-api/v1/webhooks/telegram`
7. Use a real queue/worker before production if webhook processing becomes slow. The webhook should acknowledge provider requests quickly and process large payloads durably.

## 1. Facebook Messenger setup

### Meta-side setup

1. Create a Meta developer app using a Business app type.
2. Add the Messenger product.
3. Add the app domains and privacy policy URL required by Meta.
4. Configure the app webhook callback as `https://your-domain.example/unified-api/v1/webhooks/meta`.
5. Add the automatically generated OAuth callback, `https://your-domain.example/unified-api/v1/social/callback`, to the Meta app’s valid OAuth redirect URIs.
6. Use the same value as `META_WEBHOOK_VERIFY_TOKEN` when Meta asks for the verify token.
7. Subscribe to Page messaging events, at minimum message events needed by the inbox.
8. Request the permissions needed by the current Facebook login flow:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`
   - `pages_messaging`
9. Submit the relevant permissions for App Review before connecting Pages owned by people who are not app roles.

### In the mobile app

1. Make sure the signed-in Facebook account manages the Page.
2. Open Connect and tap Facebook.
3. Complete Meta sign-in and approve the Page permissions.
4. Send a message to the Page from another Facebook account.
5. Confirm it appears in Home/Inbox, then reply from Unified.

The connection stores the Page access token and Page ID on the server. Messenger recipients are Page-scoped IDs, not phone numbers.

### Important messaging rule

Messenger replies are constrained by Meta messaging policies. The normal support flow is: customer messages the Page, then the Page replies within the allowed messaging window. Do not build arbitrary cold outreach on top of the reply endpoint.

## 2. Instagram Messaging setup

### Account requirements

1. Convert the Instagram account to a Professional account: Business or Creator.
2. Link the Instagram Professional account to a Facebook Page managed by the same Meta business.
3. In Instagram settings, enable message access for connected tools.
4. In the Meta app, enable Instagram/Messenger messaging and request:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata`
   - Page permissions required to identify and access the linked Page
5. Complete App Review and business verification for production access.

### In the mobile app

1. Finish the Page/Instagram linking first.
2. Tap Connect next to Instagram.
3. Complete the Facebook sign-in flow for the account that manages the linked Page.
4. Send a new DM to the Professional account from a separate Instagram account.
5. Reply from Unified.

The current backend finds the linked Instagram Professional account through the Page response and stores its Instagram account ID separately from the Page ID. Instagram replies now use the Instagram account messaging endpoint rather than the Facebook Page `/me/messages` endpoint.

Instagram does not support personal/consumer accounts in this integration. Conversations are customer-initiated, and group messaging is not a supported assumption.

## 3. WhatsApp Business setup

### Recommended production onboarding: Embedded Signup

For a SaaS product where each customer connects their own WhatsApp number, use Meta Embedded Signup. It lets the business owner onboard a WhatsApp Business Account and phone number through Meta’s hosted flow. The official Embedded Signup documentation says the app must go through App Review and request advanced access for the required business permissions.

The production flow should be:

1. The user taps “Connect WhatsApp Business” in the app.
2. The app opens a hosted HTTPS onboarding page owned by Unified.
3. That page runs Meta’s Embedded Signup configuration.
4. The page sends the returned onboarding code and WABA/phone identifiers to the Laravel API over a short-lived, user-bound handoff.
5. The Laravel API exchanges/validates the result, stores the encrypted token, stores the WABA ID and Phone Number ID, subscribes the app to the WABA, and returns the user to the mobile app.
6. The user sends a test WhatsApp message and confirms the webhook-to-inbox path.

This flow is implemented. Set `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` on the API, deploy the API over HTTPS, and make sure the Meta app’s Embedded Signup configuration points to the deployed domain. The mobile app will receive the hosted URL from `GET /unified-api/v1/social/whatsapp/start`, open it, and return through `unified://oauth/callback/whatsapp` after the server finishes the connection.

The hosted page listens for Meta’s `WA_EMBEDDED_SIGNUP` completion event, waits for both the OAuth code and the WABA/Phone Number IDs, exchanges the short-lived code server-side, subscribes the app to the WABA, and stores the access token using the model’s encrypted cast. The state is random, cached for ten minutes, bound to the signed-in user, and consumed once.

For Meta setup, configure:

1. `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`.
2. `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, and `META_GRAPH_API_VERSION`.
3. `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` from the Meta app’s Facebook Login for Business/Embedded Signup configuration.
4. The Meta app’s approved business permissions and HTTPS domain.

Meta’s official Embedded Signup flow is restricted to eligible Solution Partners, Tech Providers, and Tech Partners. App Review and advanced access for the relevant business permissions remain Meta-side requirements; code alone cannot grant those permissions.

### Current testing flow

1. Create or select a Meta Business Portfolio.
2. Create or select a WhatsApp Business Account (WABA).
3. Add and register a business phone number for Cloud API.
4. Generate a system-user token with the WhatsApp business permissions required by the API.
5. Copy:
   - access token
   - Phone Number ID
   - WhatsApp Business Account ID
6. In Unified, tap Connect next to WhatsApp Business. If Embedded Signup is configured, complete the hosted Meta flow; otherwise enter these values in the manual fallback form.
7. The API verifies the Phone Number ID, subscribes the WABA to the configured Meta webhook, and stores the token encrypted.
8. Send a WhatsApp message from a test phone number to the connected business number.
9. Reply from Unified.

Do not use a personal WhatsApp token, a WhatsApp Web session, or a token pasted into the mobile source code. Cloud API messages are sent to `/{Phone-Number-ID}/messages`.

### WhatsApp messaging rules

When a customer has recently messaged the business, a normal text reply can be sent through the customer-care window. Outside the permitted window, use an approved WhatsApp message template. Add template selection and template parameters before enabling campaigns or scheduled outbound messages.

## 4. Telegram setup

1. Open Telegram and message `@BotFather`.
2. Run `/newbot` and choose the bot name and username.
3. Copy the bot token. Treat it as a password.
4. Confirm `APP_URL` is a public HTTPS URL.
5. In Unified, tap Connect next to Telegram and paste the token.
6. The API calls `getMe` to verify the token.
7. The API calls `setWebhook` with:
   - `https://your-domain.example/unified-api/v1/webhooks/telegram`
   - a generated `secret_token`
   - message update types
8. Open the bot chat, tap Start, and send a message.
9. Reply from Unified.

A bot cannot read arbitrary private Telegram chats. It only receives updates from chats where the bot is present and allowed to receive messages. For groups, add the bot and review its privacy mode; for channels, use the channel update types and permissions needed by the product.

## End-to-end test checklist

Run this separately for each channel:

1. Connect the provider account.
2. Confirm the connection appears as Connected after reopening the Connect tab.
3. Send a brand-new text message from a separate customer account.
4. Check the provider webhook delivery log for a successful `2xx` response.
5. Confirm exactly one conversation and one message are stored.
6. Open the conversation in the mobile app.
7. Send a reply.
8. Confirm the provider receives the reply and the message is stored with `sender=me`.
9. Send the same webhook payload again and confirm no duplicate message is created.
10. Disconnect the channel and confirm new messages are no longer shown in the inbox.

## Common failure diagnosis

| Symptom | Most likely cause |
| --- | --- |
| Meta says redirect URI mismatch | The Meta app does not contain the automatically generated HTTPS callback, `/unified-api/v1/social/callback`, in its valid OAuth redirect URIs. |
| Facebook connects but no messages arrive | Page was not subscribed to the app, webhook `messages` field is missing, or App Review/permission access is incomplete. |
| Instagram connects but no DMs arrive | Account is personal, not linked to the Page, message access is disabled, or `instagram_manage_messages` is not approved. |
| WhatsApp credential validation fails | Wrong token type, wrong Phone Number ID, WABA not subscribed, or Graph API version mismatch. |
| WhatsApp sends but inbound is empty | The WABA was not subscribed to the app webhook, or the webhook callback/verify token is wrong. |
| Telegram connection fails | Bot token is wrong, API URL is not public HTTPS, or another webhook/getUpdates configuration is still active. |
| Messages appear twice | Webhook idempotency is broken or duplicate external IDs are not protected by a database constraint. |
| Reply is rejected after a long delay | The provider’s customer-care window has closed; use an approved template where required. |

## Security checklist

- Keep Meta app secrets, Page tokens, WhatsApp tokens, and Telegram bot tokens in server-side environment/secret storage.
- Never log access tokens or return them in mobile API responses.
- Keep the existing encrypted model cast for provider access tokens.
- Verify Meta `X-Hub-Signature-256` before processing webhook bodies.
- Verify Telegram `X-Telegram-Bot-Api-Secret-Token` before processing updates.
- Keep webhook handlers idempotent by provider message ID.
- Use HTTPS everywhere and do not follow arbitrary provider callback URLs.
- Request only the provider permissions needed for messaging.
- Do not send marketing or unsolicited messages through support-reply endpoints.

## Official references

- [Meta Messenger Platform API collection](https://www.postman.com/meta/messenger-platform-api/documentation/iyp204x/messenger-platform-api?entity=folder-22794852-9fcfb7b7-1d80-422d-b5c8-eb2b1003d4fc)
- [Meta Instagram API collection](https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api)
- [Meta WhatsApp Business Platform collections](https://www.postman.com/meta/whatsapp-business-platform/overview)
- [Meta WhatsApp Embedded Signup](https://www.postman.com/meta/whatsapp-business-platform/documentation/du6gzjv/embedded-signup)
- [WhatsApp developer hub](https://whatsappbusiness.com/developers/developer-hub/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
