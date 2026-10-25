<?php

namespace App\Http\Requests\Admin;

use App\Models\Plan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class PlanUpdateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $plan = $this->route('plan');
        $plan = $plan instanceof Plan ? $plan : null;
        $priceNgn = $this->input('price_ngn');
        $replyAllowance = $this->input('reply_allowance');

        $this->merge([
            'billing_type' => $this->input('billing_type', $plan?->billing_type ?? 'monthly'),
            'price_ngn' => $priceNgn ?? ((int) $this->input('price_units', $plan?->price_units ?? 0) * (int) config('services.wallet.unit_price_ngn', 10)),
            'reply_allowance' => $replyAllowance ?? $this->input('message_limit', $plan?->reply_allowance),
            'channel_limit' => $this->input('channel_limit', $plan?->channel_limit ?? 1),
            'user_limit' => $this->input('user_limit', $plan?->user_limit ?? 1),
            'is_lifetime_allowance' => $this->input('is_lifetime_allowance', $plan?->is_lifetime_allowance ?? false),
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->is_admin || in_array(Str::lower($user->email), array_map(Str::lower(...), config('admin.emails', [])), true));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'billing_type' => ['required', 'in:free,monthly,payg'],
            'price_ngn' => ['required', 'integer', 'min:0'],
            'price_per_reply_ngn' => ['nullable', 'integer', 'min:0'],
            'reply_allowance' => ['nullable', 'integer', 'min:0'],
            'channel_limit' => ['required', 'integer', 'min:1'],
            'user_limit' => ['required', 'integer', 'min:1'],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'features' => ['nullable', 'string', 'max:2000'],
            'description' => ['nullable', 'string', 'max:1000'],
            'best_for' => ['nullable', 'string', 'max:160'],
            'is_lifetime_allowance' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function planData(): array
    {
        $data = $this->validated();
        $data['features'] = collect(preg_split('/\r\n|\r|\n/', (string) ($data['features'] ?? '')))
            ->map(fn (string $feature): string => trim($feature))
            ->filter()
            ->values()
            ->all();
        $data['price_units'] = $data['billing_type'] === 'monthly'
            ? (int) ceil($data['price_ngn'] / max((int) config('services.wallet.unit_price_ngn', 10), 1))
            : 0;
        $data['message_limit'] = $data['reply_allowance'];

        return $data;
    }
}
