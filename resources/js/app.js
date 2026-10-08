const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');

menuToggle?.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
        menu?.classList.remove('is-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
    });
});

const conversations = [
    {
        id: 'amaka', name: 'Amaka Eze', initials: 'AE', channel: 'whatsapp', channelLabel: 'WhatsApp',
        preview: 'Hi! Is the blue ankara set still available?', time: '10:51', unread: 2, avatar: 'avatar-orange',
        messages: [
            { type: 'received', text: 'Hi! Is the blue ankara set still available in size M?', time: '10:51 AM' },
            { type: 'sent', text: 'Hi Amaka! Yes, it is available. I’ll reserve one for you. 😊', time: '10:52 AM' },
        ],
    },
    {
        id: 'tunde', name: 'Tunde Bakare', initials: 'TB', channel: 'instagram', channelLabel: 'Instagram',
        preview: 'Saw your reel. Do you deliver?', time: '10:26', unread: 1, avatar: 'avatar-purple',
        messages: [
            { type: 'received', text: 'Saw your reel. Do you deliver to Ikeja?', time: '10:26 AM' },
        ],
    },
    {
        id: 'grace', name: 'Grace Mensah', initials: 'GM', channel: 'facebook', channelLabel: 'Facebook',
        preview: 'Can I move my appointment?', time: '09:58', unread: 0, avatar: 'avatar-green',
        messages: [
            { type: 'received', text: 'Can I move my appointment to next week?', time: '09:58 AM' },
            { type: 'sent', text: 'Of course. I’ll send over the available slots.', time: '10:02 AM' },
        ],
    },
    {
        id: 'kelechi', name: 'Kelechi Obi', initials: 'KO', channel: 'telegram', channelLabel: 'Telegram',
        preview: 'Payment sent, thank you!', time: '09:18', unread: 0, avatar: 'avatar-blue',
        messages: [
            { type: 'received', text: 'Payment sent, thank you! Looking forward to delivery.', time: '09:18 AM' },
        ],
    },
    {
        id: 'ife', name: 'Ife Adeyemi', initials: 'IA', channel: 'whatsapp', channelLabel: 'WhatsApp',
        preview: 'Do you restock the linen set?', time: 'Yesterday', unread: 1, avatar: 'avatar-pink',
        messages: [
            { type: 'received', text: 'Do you restock the linen set in medium?', time: 'Yesterday' },
        ],
    },
];

let activeConversation = conversations[0];
let activeInboxChannel = 'all';
let demoHasUserInteraction = false;
let demoTimer;
let demoTypingTimer;

const demoMessages = {
    amaka: 'Do you have this in navy blue as well?',
    tunde: 'Perfect, I’ll send my delivery address here.',
    grace: 'Thanks, that new time works for me.',
    kelechi: 'Please share the tracking details when ready.',
    ife: 'Medium would be perfect. I’ll wait for the restock.',
};

const conversationList = document.querySelector('[data-conversation-list]');
const chatBody = document.querySelector('[data-chat-body]');
const chatName = document.querySelector('[data-chat-name]');
const chatChannel = document.querySelector('[data-chat-channel]');
const inboxWindow = document.querySelector('.inbox-window');

const pauseDemoAnimation = () => {
    demoHasUserInteraction = true;
    window.clearTimeout(demoTimer);
    window.clearTimeout(demoTypingTimer);
};

const setActiveInboxTab = () => {
    document.querySelectorAll('[data-inbox-channel]').forEach((item) => {
        item.classList.toggle('active', item.dataset.inboxChannel === activeInboxChannel);
    });
};

const showTypingIndicator = () => {
    if (!chatBody) return;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.setAttribute('aria-label', `${activeConversation.name} is typing`);

    for (let index = 0; index < 3; index += 1) {
        typingIndicator.append(document.createElement('span'));
    }

    chatBody.append(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;
};

const renderChat = () => {
    if (!chatBody || !activeConversation) return;

    chatName.textContent = activeConversation.name;
    chatChannel.textContent = activeConversation.channelLabel;
    chatBody.replaceChildren();

    activeConversation.messages.forEach((message) => {
        const messageElement = document.createElement('div');
        const timeElement = document.createElement('small');

        messageElement.className = `message ${message.type}`;
        messageElement.textContent = message.text;
        timeElement.textContent = message.time;
        messageElement.append(timeElement);
        chatBody.append(messageElement);
    });

    chatBody.scrollTop = chatBody.scrollHeight;
};

const renderConversationList = () => {
    if (!conversationList) return;

    conversationList.replaceChildren();

    conversations
        .filter((conversation) => activeInboxChannel === 'all' || conversation.channel === activeInboxChannel)
        .forEach((conversation) => {
            const conversationButton = document.createElement('button');
            const avatar = document.createElement('span');
            const details = document.createElement('div');
            const name = document.createElement('strong');
            const preview = document.createElement('small');
            const time = document.createElement('time');

            conversationButton.type = 'button';
            conversationButton.className = `conversation${conversation.id === activeConversation.id ? ' selected' : ''}`;
            conversationButton.dataset.conversationId = conversation.id;
            conversationButton.setAttribute('aria-label', `Open conversation with ${conversation.name}`);

            avatar.className = `avatar ${conversation.avatar}`;
            avatar.textContent = conversation.initials;
            name.textContent = conversation.name;
            preview.textContent = conversation.preview;
            time.textContent = conversation.time;
            details.append(name, preview);
            conversationButton.append(avatar, details, time);

            if (conversation.unread > 0) {
                const unread = document.createElement('i');
                unread.className = 'unread';
                unread.textContent = conversation.unread;
                conversationButton.append(unread);
            }

            conversationButton.addEventListener('click', () => {
                pauseDemoAnimation();
                activeConversation = conversation;
                activeConversation.unread = 0;
                renderConversationList();
                renderChat();
            });

            conversationList.append(conversationButton);
        });
};

document.querySelectorAll('[data-inbox-channel]').forEach((tab) => {
    tab.addEventListener('click', () => {
        pauseDemoAnimation();
        activeInboxChannel = tab.dataset.inboxChannel;
        document.querySelectorAll('[data-inbox-channel]').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');

        const activeIsVisible = activeInboxChannel === 'all' || activeConversation.channel === activeInboxChannel;

        if (!activeIsVisible) {
            activeConversation = conversations.find((conversation) => conversation.channel === activeInboxChannel) ?? conversations[0];
        }

        renderConversationList();
        renderChat();
    });
});

document.querySelector('[data-chat-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const input = form.elements.reply;
    const text = input.value.trim();

    if (!text) return;

    pauseDemoAnimation();

    activeConversation.messages.push({ type: 'sent', text, time: 'Just now' });
    activeConversation.preview = text;
    activeConversation.time = 'Now';
    input.value = '';
    renderConversationList();
    renderChat();
});

document.querySelector('[data-chat-form] input')?.addEventListener('focus', pauseDemoAnimation);

const channelContent = {
    whatsapp: ['WhatsApp', 'Customer questions, orders, support requests, and follow-ups.'],
    instagram: ['Instagram', 'DMs, customer enquiries, comments, and interactions.'],
    facebook: ['Facebook', 'Messages, comments, and customer conversations.'],
    more: ['More channels', 'Connect the platforms your business uses and manage conversations from one place.'],
};

document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('[data-tab]').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');

        const [title, copy] = channelContent[tab.dataset.tab];
        const icon = document.querySelector('[data-channel-icon]');

        document.querySelector('[data-channel-title]').textContent = title;
        document.querySelector('[data-channel-copy]').textContent = copy;
        icon.textContent = title === 'WhatsApp' ? 'W' : title === 'Instagram' ? 'I' : title === 'Facebook' ? 'f' : '✦';
        icon.className = `channel-panel-icon ${tab.dataset.tab === 'more' ? 'telegram' : tab.dataset.tab}`;
    });
});

const audienceContent = {
    Retail: ['Manage every product question with context.', 'Manage product enquiries, orders, availability questions, and customer follow-ups.'],
    Services: ['Keep every booking moving forward.', 'Respond to enquiries, bookings, consultations, and support requests from one shared inbox.'],
    Restaurants: ['Turn hungry questions into happy orders.', 'Handle menu enquiries, reservations, delivery questions, and customer feedback without missing a beat.'],
    'Online businesses': ['Meet customers wherever they discover you.', 'Manage customer conversations across the platforms where your online business gets noticed.'],
    'Growing teams': ['Give your team one source of truth.', 'Give sales, support, and customer service teams one shared communication hub.'],
};

document.querySelectorAll('.audience-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.audience-tab').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');

        const [title, copy] = audienceContent[tab.textContent];
        document.querySelector('[data-audience-label]').textContent = tab.textContent;
        document.querySelector('[data-audience-title]').textContent = title;
        document.querySelector('[data-audience-copy]').textContent = copy;
    });
});

const comparisonContent = {
    without: {
        status: 'Scattered across apps',
        count: '6 friction points',
        items: ['Constantly switching between apps', 'Missing customer messages', 'Forgetting to reply', 'Losing track of conversations', 'Checking notifications manually', 'Multiple people responding to the same customer'],
    },
    with: {
        status: 'Clear and connected',
        count: '6 calmer habits',
        items: ['One centralized inbox', 'All conversations in one place', 'Clear unread notifications', 'Faster, more confident responses', 'Searchable customer context', 'Better team collaboration'],
    },
};

const renderComparison = (view) => {
    const content = comparisonContent[view];
    const list = document.querySelector('[data-comparison-list]');

    document.querySelector('[data-comparison-status]').textContent = content.status;
    document.querySelector('[data-comparison-count]').textContent = content.count;
    list.replaceChildren();

    content.items.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        if (view === 'with') listItem.classList.add('positive');
        list.append(listItem);
    });
};

const autoCycleTabs = (selector, interval) => {
    const tabs = [...document.querySelectorAll(selector)];

    if (tabs.length < 2) return;

    let activeIndex = Math.max(0, tabs.findIndex((tab) => tab.classList.contains('active')));
    let isAutomaticChange = false;
    let timer;

    const pause = () => {
        if (isAutomaticChange) return;

        window.clearInterval(timer);
    };

    tabs.forEach((tab) => tab.addEventListener('click', pause));

    timer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % tabs.length;
        isAutomaticChange = true;
        tabs[activeIndex].click();
        isAutomaticChange = false;
    }, interval);
};

document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        renderComparison(button.dataset.view);
    });
});

document.querySelector('[data-waitlist]')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const message = form.querySelector('[data-form-message]');

    message.textContent = 'You’re on the list. We’ll be in touch.';
    form.reset();
});

const runDemoAnimation = () => {
    if (demoHasUserInteraction) return;

    const currentIndex = conversations.indexOf(activeConversation);
    activeConversation = conversations[(currentIndex + 1) % conversations.length];
    activeInboxChannel = activeConversation.channel;
    setActiveInboxTab();
    renderConversationList();
    renderChat();
    inboxWindow?.classList.add('is-demo-pulsing');

    window.setTimeout(() => inboxWindow?.classList.remove('is-demo-pulsing'), 1200);
    showTypingIndicator();

    demoTypingTimer = window.setTimeout(() => {
        if (demoHasUserInteraction) return;

        if (!activeConversation.demoMessageShown) {
            const text = demoMessages[activeConversation.id];
            activeConversation.messages.push({ type: 'received', text, time: 'Just now' });
            activeConversation.preview = text;
            activeConversation.time = 'Now';
            activeConversation.demoMessageShown = true;
        }

        renderConversationList();
        renderChat();
        demoTimer = window.setTimeout(runDemoAnimation, 4200);
    }, 1100);
};

const revealItems = document.querySelectorAll('.section, .inbox-demo-wrap, .cta');

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => {
        item.classList.add('reveal');
        revealObserver.observe(item);
    });
} else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
}

renderConversationList();
renderChat();
renderComparison('without');

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    demoTimer = window.setTimeout(runDemoAnimation, 4500);
    autoCycleTabs('[data-tab]', 5000);
    autoCycleTabs('.audience-tab', 5800);
    autoCycleTabs('[data-view]', 6800);
}
