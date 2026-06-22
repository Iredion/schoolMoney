import { Form, useActionData, useNavigation, Link } from "react-router";
import { FaGraduationCap } from "react-icons/fa";
import "./registerForm.css";

export default function RegisterForm() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  return (
    <div className="app-register">
      <div className="register-container animate-fade-in">
        {/* Header */}
        <div className="register-header">
          <div className="register-logo">
            <div className="register-logo-icon">
              <FaGraduationCap size={28} />
            </div>
            <span className="register-logo-text">SchoolMoney</span>
          </div>
          <p className="register-subtitle">Utwórz nowe konto rodzica</p>
        </div>

        {/* Body */}
        <div className="register-body">
          <Form method="post">
            {actionData?.error && (
              <p className="alert alert-error">{actionData.error}</p>
            )}

            <div className="register-row">
              <div className="form-group">
                <label className="form-label">Imię *</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  placeholder="Wpisz imię"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nazwisko *</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  placeholder="Wpisz nazwisko"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Wpisz adres e-mail"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hasło *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Wpisz hasło"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary register-submit" disabled={isLoading}>
              {isLoading ? "Rejestracja..." : "Zarejestruj się"}
            </button>
          </Form>

          <p className="register-footer-text">
            Masz już konto?{" "}
            <Link to="/" className="register-link">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
