import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Auth() {
  const [isLogin, setIsLogin] = createSignal(true);
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      if (isLogin()) {
        await auth.login(username(), password());
        toast.showSuccess("Successfully logged in!");
      } else {
        await auth.register(username(), password());
        toast.showSuccess("Account created successfully!");
      }
      navigate("/");
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  return (
    <div>
      <header class="my-2 p-4 md:my-4 md:p-6 flex flex-col items-center justify-center">
        <h1 class="text-2xl md:text-3xl mb-2 md:mb-4">Jaspy Notes</h1>
        <p class="text-center text-sm text-gray-500">
          <a href="https://www.linkedin.com/in/jaspermacnaughton" class="text-blue-500 underline">Jasper MacNaughton</a>'s sticky note app.
        </p>
      </header>
      
      <div class="flex min-h-full flex-col justify-center px-6 py-4 sm:py-2 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 class="mt-10 text-center text-2xl font-bold leading-9">
            {isLogin() ? "Sign in to your account" : "Create a new account"}
          </h2>
        </div>

        <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form class="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label class="block text-sm font-medium leading-6">
                Username
              </label>
              <input
                type="text"
                required
                autocomplete="username"
                class="block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium leading-6">
                Password
              </label>
              <input
                type="password"
                autocomplete={isLogin() ? "current-password" : "new-password"}
                required
                class="block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
            </div>

            <button
              type="submit"
              class="btn w-full"
            >
              {isLogin() ? "Sign in" : "Register"}
            </button>
          </form>

          <p class="mt-10 text-center text-sm text-gray-500">
            {isLogin() ? "Don't have an account? " : "Already have an account? "}
            <button
              class="font-semibold text-amber-600 hover:text-amber-500"
              onClick={() => setIsLogin(!isLogin())}
            >
              {isLogin() ? "Register here" : "Sign in here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 