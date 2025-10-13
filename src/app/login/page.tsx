import { LoginForm } from "@/components/loginform"

// La página de login usa el componente de cliente LoginForm
export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoginForm />
        </div>
    )
}