"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setBusy(true);

    const loginId = username.trim();

    if (!loginId || !password) {
      setError("Please enter your Login ID and password.");
      setBusy(false);
      return;
    }

    const email = `${loginId}@smilingpearl.local`;

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      console.error("Login error:", signInError);

      setError("Invalid login ID or password.");
      setBusy(false);

      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="loginPage">

      {/* Decorative background elements */}

      <div className="loginGlow loginGlowOne" />
      <div className="loginGlow loginGlowTwo" />


      <div className="loginShell">

        {/* =================================================
            LEFT BRAND PANEL
        ================================================= */}

        <section className="loginBrand">

          <div className="loginBrandTop">

            <div className="loginLogo">
              🦷
            </div>

            <div>
              <div className="loginBrandName">
                Smiling Pearl
              </div>

              <div className="loginBrandClinic">
                Dental Clinic
              </div>
            </div>

          </div>


          <div className="loginHeroContent">

            <div className="loginEyebrow">
              <span />
              CLINIC MANAGEMENT SYSTEM
            </div>

            <h1>
              Caring for smiles.
              <br />
              <span>Managing with ease.</span>
            </h1>

            <p>
              A simple and secure workspace for managing
              patients, appointments, clinical records and
              prescriptions.
            </p>

          </div>


          <div className="loginFeatures">

            <div className="loginFeature">
              <div className="loginFeatureIcon">
                ✓
              </div>

              <div>
                <strong>
                  Secure access
                </strong>

                <span>
                  Protected clinic information
                </span>
              </div>
            </div>


            <div className="loginFeature">
              <div className="loginFeatureIcon">
                ✓
              </div>

              <div>
                <strong>
                  Simple workflow
                </strong>

                <span>
                  Everything in one place
                </span>
              </div>
            </div>


            <div className="loginFeature">
              <div className="loginFeatureIcon">
                ✓
              </div>

              <div>
                <strong>
                  Better patient care
                </strong>

                <span>
                  Stay organised and connected
                </span>
              </div>
            </div>

          </div>


          <div className="loginBrandFooter">
            <span className="loginFooterDot" />
            Smiling Pearl Dental Clinic
          </div>

        </section>


        {/* =================================================
            RIGHT LOGIN PANEL
        ================================================= */}

        <section className="loginFormArea">

          <div className="loginCard">

            <div className="loginMobileLogo">
              🦷
            </div>


            <div className="loginHeading">

              <div className="loginWelcome">
                Welcome back
              </div>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Enter your clinic credentials to continue.
              </p>

            </div>


            <form onSubmit={submit}>

              {/* LOGIN ID */}

              <div className="loginField">

                <label htmlFor="username">
                  Login ID
                </label>

                <div className="loginInputWrapper">

                  <span className="loginInputIcon">
                    ◉
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    placeholder="Enter your Login ID"
                    autoComplete="username"
                    required
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="loginField">

                <div className="loginPasswordLabel">

                  <label htmlFor="password">
                    Password
                  </label>

                </div>

                <div className="loginInputWrapper">

                  <span className="loginInputIcon">
                    ●
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="passwordToggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>


              {/* ERROR */}

              {error && (
                <div
                  className="loginError"
                  role="alert"
                >
                  <span className="loginErrorIcon">
                    !
                  </span>

                  <span>
                    {error}
                  </span>
                </div>
              )}


              {/* SUBMIT */}

              <button
                className="loginSubmit"
                type="submit"
                disabled={busy}
              >

                {busy ? (
                  <>
                    <span className="loginSpinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="loginArrow">
                      →
                    </span>
                  </>
                )}

              </button>


            </form>


            <div className="loginSecurity">

              <span className="securityLock">
                ◆
              </span>

              <span>
                Secure clinic access
              </span>

            </div>

          </div>


          <div className="loginCopyright">
            © {new Date().getFullYear()} Smiling Pearl Dental Clinic
          </div>

        </section>

      </div>

    </main>
  );
}