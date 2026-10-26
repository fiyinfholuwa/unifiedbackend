<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Connect WhatsApp Business</title>
    <style>
        :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07150f; color: #f4faf7; }
        main { width: min(92vw, 520px); padding: 36px; border: 1px solid #1b4938; border-radius: 24px; background: #0d241b; box-shadow: 0 24px 70px #0006; text-align: center; }
        h1 { margin: 0 0 12px; font-size: 30px; }
        p { color: #a8b9b1; line-height: 1.6; }
        button { margin-top: 18px; border: 0; border-radius: 12px; padding: 14px 22px; background: #16a36f; color: #fff; font-weight: 700; font-size: 16px; cursor: pointer; }
        button:disabled { opacity: .55; cursor: wait; }
        #status { min-height: 24px; margin-top: 18px; color: #74e0b4; }
        .small { font-size: 13px; color: #80968c; }
    </style>
</head>
<body>
<main>
    <h1>Connect WhatsApp Business</h1>
    <p>Complete Meta’s secure onboarding flow to connect your WhatsApp Business number. Your access token is sent directly to the server and is never placed in the mobile deep link.</p>
    <button id="connect" type="button">Continue with Meta</button>
    <div id="status" role="status"></div>
    <p class="small">You can close this page after the app opens again.</p>
</main>
<script>
    const state = @json($state);
    const configId = @json($configId);
    const appId = @json($facebookAppId);
    const graphApiVersion = @json($graphApiVersion);
    const completeUrl = @json(route('social.whatsapp.signup.complete'));
    const redirectBase = @json(rtrim((string) $mobileRedirect, '/'));
    const button = document.getElementById('connect');
    const status = document.getElementById('status');
    let embeddedSignupInfo = null;
    let authorizationCode = null;
    let submitted = false;

    const setStatus = (message, isError = false) => {
        status.textContent = message;
        status.style.color = isError ? '#ff9c9c' : '#74e0b4';
    };

    const finish = async () => {
        if (submitted || !authorizationCode || !embeddedSignupInfo) return;
        submitted = true;
        button.disabled = true;
        setStatus('Finishing WhatsApp setup…');

        try {
            const response = await fetch(completeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    state,
                    code: authorizationCode,
                    waba_id: embeddedSignupInfo.waba_id,
                    phone_number_id: embeddedSignupInfo.phone_number_id,
                    business_id: embeddedSignupInfo.business_id || null,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.message || 'WhatsApp setup could not be completed.');
            setStatus('Connected. Returning to the app…');
            window.location.href = payload.redirect_url || (redirectBase + '/whatsapp?success=1');
        } catch (error) {
            submitted = false;
            button.disabled = false;
            setStatus(error.message, true);
        }
    };

    window.addEventListener('message', (event) => {
        if (!/^https:\/\/([a-z0-9-]+\.)?facebook\.com$/i.test(event.origin)) return;
        let data;
        try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
        if (!data || data.type !== 'WA_EMBEDDED_SIGNUP') return;
        if (String(data.event || '').startsWith('FINISH')) {
            embeddedSignupInfo = data.data || {};
            if (!embeddedSignupInfo.waba_id || !embeddedSignupInfo.phone_number_id) {
                setStatus('Meta did not return a WhatsApp number. Please restart setup.', true);
                return;
            }
            setStatus('WhatsApp account selected. Finishing setup…');
            finish();
        } else if (data.event === 'CANCEL') {
            setStatus('WhatsApp setup was cancelled.', true);
        } else if (data.event === 'ERROR') {
            setStatus(data.data?.error_message || 'Meta reported an onboarding error.', true);
        }
    });

    window.fbAsyncInit = () => {
        FB.init({ appId, cookie: true, xfbml: true, version: graphApiVersion });
        button.addEventListener('click', () => {
            button.disabled = true;
            setStatus('Opening Meta onboarding…');
            FB.login((response) => {
                authorizationCode = response?.authResponse?.code || null;
                if (!authorizationCode) {
                    button.disabled = false;
                    setStatus('Meta login did not return an authorization code.', true);
                    return;
                }
                finish();
            }, {
                config_id: configId,
                response_type: 'code',
                override_default_response_type: true,
                extras: { setup: {}, sessionInfoVersion: '3' },
            });
        });
    };

    (function (document, tag, id) {
        const script = document.createElement(tag);
        script.id = id;
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        document.head.appendChild(script);
    }(document, 'script', 'facebook-jssdk'));
</script>
</body>
</html>
