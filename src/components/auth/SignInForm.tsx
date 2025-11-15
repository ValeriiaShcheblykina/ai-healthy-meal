import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from './FormField'
import { PasswordInput } from './PasswordInput'
import { signInSchema, type SignInFormData } from '@/lib/validation/auth.validation'
import type { ZodError } from 'zod'

export function SignInForm() {
  const [formData, setFormData] = useState<Partial<SignInFormData>>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({})
  const [globalError, setGlobalError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: keyof SignInFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (globalError) {
      setGlobalError('')
    }
  }

  const handleBlur = (field: keyof SignInFormData) => {
    // Validate single field on blur
    const result = signInSchema.shape[field].safeParse(formData[field])
    
    if (result.success) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    } else {
      const fieldError = result.error.issues[0]?.message
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    setErrors({})

    // Validate form
    try {
      const validatedData = signInSchema.parse(formData)
      setIsLoading(true)

      // Call sign-in API
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
        credentials: 'include', // Include cookies in request and response
      })

      const data = await response.json()

      if (!response.ok) {
        setGlobalError(data.error?.message || 'Sign in failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Redirect to recipes page
      window.location.href = '/recipes'
    } catch (error) {
      setIsLoading(false)
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError
        const fieldErrors: Partial<Record<keyof SignInFormData, string>> = {}
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof SignInFormData
          if (field) {
            fieldErrors[field] = issue.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setGlobalError('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {globalError && (
        <div
          className="bg-destructive/10 text-destructive px-4 py-3 rounded-md border border-destructive/20"
          role="alert"
        >
          {globalError}
        </div>
      )}

      <FormField label="Email" htmlFor="email" required error={errors.email}>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          aria-required="true"
        />
      </FormField>

      <FormField label="Password" htmlFor="password" required error={errors.password}>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isLoading}
          aria-required="true"
        />
      </FormField>

      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-sm text-primary hover:underline font-medium"
        >
          Forgot password?
        </a>
      </div>

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{' '}
          <a href="/sign-up" className="text-primary hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </form>
  )
}

