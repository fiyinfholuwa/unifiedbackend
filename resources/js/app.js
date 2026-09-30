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

const revealItems = document.querySelectorAll('.section, .inbox-window, .cta');

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

document.querySelectorAll('.side-link').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        document.querySelectorAll('.side-link').forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
    });
});

const channelContent = {
    whatsapp: ['WhatsApp', 'Customer questions, orders, support requests, and follow-ups.'],
    instagram: ['Instagram', 'DMs, customer enquiries, comments, and interactions.'],
    facebook: ['Facebook', 'Messages, comments, and customer conversations.'],
    more: ['More Channels', 'Connect the platforms your business uses and manage conversations from one place.'],
};

document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('[data-tab]').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');
        const [title, copy] = channelContent[tab.dataset.tab];
        document.querySelector('[data-channel-title]').textContent = title;
        document.querySelector('[data-channel-copy]').textContent = copy;
    });
});

const audienceCopy = {
    Retail: 'Manage product enquiries, orders, availability questions, and customer follow-ups.',
    Services: 'Respond to enquiries, bookings, consultations, and support requests.',
    Restaurants: 'Handle menu enquiries, reservations, delivery questions, and customer feedback.',
    'Online Businesses': 'Manage customer conversations across the platforms where your customers find you.',
    'Growing Teams': 'Give your sales, support, and customer service teams one shared communication hub.',
};

document.querySelectorAll('.audience-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.audience-tab').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');
        document.querySelector('.audience-panel h3').textContent = tab.textContent;
        document.querySelector('.audience-panel p').textContent = audienceCopy[tab.textContent];
    });
});

const comparisonContent = {
    without: ['Constantly switching between apps', 'Missing customer messages', 'Forgetting to reply', 'Losing track of conversations', 'Checking notifications manually', 'Multiple people responding to the same customer'],
    with: ['One centralized inbox', 'All conversations in one place', 'Clear unread notifications', 'Faster responses', 'Organized conversations', 'Better team collaboration'],
};

document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        document.querySelector('.comparison-list').innerHTML = comparisonContent[button.dataset.view].map((item) => `<li class="${button.dataset.view === 'with' ? 'positive' : ''}">${item}</li>`).join('');
    });
});

document.querySelector('[data-waitlist]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = event.currentTarget.querySelector('[data-form-message]');
    message.textContent = 'You’re on the list. We’ll be in touch.';
    event.currentTarget.reset();
});
