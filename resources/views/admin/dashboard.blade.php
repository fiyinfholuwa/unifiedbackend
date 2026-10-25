@extends('admin.layout', ['title' => 'Overview'])

@section('content')
    <section>
        <p class="admin-kicker">Command centre</p>
        <h1 class="admin-heading">Good to see you, {{ str(auth()->user()->name)->before(' ') }}.</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-[#aaa5c3]">A clear view of the users, channels and support work powering your mobile experience.</p>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            @foreach ([
                ['label' => 'Total users', 'value' => number_format($stats['users']), 'detail' => number_format($stats['activeUsers']).' active', 'icon' => '♙', 'tone' => 'purple'],
                ['label' => 'Messages handled', 'value' => number_format($stats['messages']), 'detail' => number_format($stats['monthlyUsage']).' this month', 'icon' => '↗', 'tone' => 'blue'],
                ['label' => 'Connected channels', 'value' => number_format($stats['connections']), 'detail' => 'Across user accounts', 'icon' => '⌁', 'tone' => 'green'],
                ['label' => 'Needs attention', 'value' => number_format($stats['openSupport'] + $stats['pendingKyc']), 'detail' => number_format($stats['openSupport']).' support · '.number_format($stats['pendingKyc']).' KYC', 'icon' => '!', 'tone' => 'coral'],
            ] as $stat)
                <article class="admin-stat-card">
                    <div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold text-[#9892b5]">{{ $stat['label'] }}</p><p class="mt-3 text-3xl font-bold tracking-tight text-white">{{ $stat['value'] }}</p></div><span class="admin-stat-icon admin-stat-icon-{{ $stat['tone'] }}">{{ $stat['icon'] }}</span></div>
                    <p class="mt-5 text-xs text-[#817b9f]">{{ $stat['detail'] }}</p>
                </article>
            @endforeach
        </div>
    </section>

    <section class="mt-12">
        <div class="admin-section-heading"><div><p class="admin-kicker">Shortcuts</p><h2 class="admin-section-title">Manage the workspace</h2></div></div>
        <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            @foreach ([['route' => 'admin.users', 'label' => 'Users', 'copy' => 'Search accounts and change access.'], ['route' => 'admin.support', 'label' => 'Support inbox', 'copy' => 'Work through customer requests.'], ['route' => 'admin.kyc', 'label' => 'KYC review', 'copy' => 'Review submitted identity checks.'], ['route' => 'admin.connections', 'label' => 'Connections', 'copy' => 'Monitor connected channels.'], ['route' => 'admin.plans', 'label' => 'Plans', 'copy' => 'Update pricing and limits.']] as $shortcut)
                <a href="{{ route($shortcut['route']) }}" class="admin-shortcut-card"><span class="admin-shortcut-arrow">↗</span><h3>{{ $shortcut['label'] }}</h3><p>{{ $shortcut['copy'] }}</p></a>
            @endforeach
        </div>
    </section>

    <section class="mt-12">
        <div class="admin-section-heading"><div><p class="admin-kicker">Latest activity</p><h2 class="admin-section-title">Recently registered users</h2></div><a href="{{ route('admin.users') }}" class="admin-secondary-button">View all users <span>→</span></a></div>
        <div class="admin-panel mt-5 overflow-hidden"><div class="overflow-x-auto"><table class="admin-table"><thead><tr><th>User</th><th>Plan</th><th>Joined</th></tr></thead><tbody>@forelse ($recentUsers as $user)<tr><td><div class="flex items-center gap-3"><span class="admin-table-avatar">{{ str($user->name)->substr(0, 1)->upper() }}</span><div><p class="font-semibold text-white">{{ $user->name }}</p><p class="mt-1 text-xs text-[#8b86a8]">{{ $user->email }}</p></div></div></td><td><span class="admin-badge admin-badge-purple">{{ $user->subscription?->plan?->name ?? 'Free' }}</span></td><td class="text-sm text-[#aaa5c3]">{{ $user->created_at->diffForHumans() }}</td></tr>@empty<tr><td colspan="3" class="py-10 text-center text-sm text-[#8f89aa]">No users yet.</td></tr>@endforelse</tbody></table></div></div>
    </section>
@endsection
