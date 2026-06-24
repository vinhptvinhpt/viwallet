# Toast: using Sonner (not shadcn/ui toast)

shadcn v4 deprecated the `toast` component in favour of `sonner`.
All tasks should import toast from `sonner` directly:

    import { toast } from 'sonner'
    toast.success('Saved!')
    toast.error('Something went wrong')

The `<Toaster />` component from `@/components/ui/sonner` is mounted in `app/layout.tsx`.
