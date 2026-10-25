<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class PlanUpdateRequest extends FormRequest
{
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
            'price_units' => ['required', 'integer', 'min:0'],
            'message_limit' => ['nullable', 'integer', 'min:0'],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'features' => ['nullable', 'string', 'max:2000'],
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

        return $data;
    }
}
