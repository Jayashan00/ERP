<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class CheckInstallation
{
    public function handle(Request $request, Closure $next)
    {
        if (!$this->isInstalled() && !$request->is('install*')) {
            // Ensure storage link exists
            $this->ensureStorageLink();
            return redirect()->route('installer.welcome');
        }

        if ($this->isInstalled() && $request->is('install*')) {
            return redirect('/dashboard');
        }

        return $next($request);
    }

    private function isInstalled(): bool
    {
        return File::exists(storage_path('installed'));
    }

    /**
     * Ensure storage symlink exists
     */
    private function ensureStorageLink()
    {
        if (!File::exists(public_path('storage'))) {
            try {
                Artisan::call('storage:link');
            } catch (\Exception $e) {
                // Silently fail if unable to create link
            }
        }
    }
}