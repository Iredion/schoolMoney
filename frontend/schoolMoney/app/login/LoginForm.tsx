import * as React from "react";
import { Form, useActionData, useNavigation, Link } from "react-router";
import { FaGraduationCap } from "react-icons/fa";
import "./loginForm.css";

interface LoginState {
  password: string;
  email: string;
  error: string;
}

type LoginAction =
  | { type: "error" }
  | { type: "field"; fieldName: string; payload: string };

const loginReducer = (state: LoginState, action: LoginAction): LoginState => {
  switch (action.type) {
    case "field":
      return { ...state, [action.fieldName]: action.payload };
    case "error":
      return {
        ...state,
        email: "",
        password: "",
        error: "Nieprawidłowy email lub hasło!"
      };
    default:
      return state;
  }
};

const initialState: LoginState = {
  password: "",
  email: "",
  error: ""
};

export default function LoginForm() {
  const [state, dispatch] = React.useReducer(loginReducer, initialState);
  const { email, password, error } = state;

  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  return (
    <div className="app-login">
      <div className="login-container animate-fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ 
                background: "white", 
                color: "#C2410C",
                padding: "10px", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
                <FaGraduationCap size={28} />
            </div>
            <span style={{ 
                color: "white", 
                textShadow: "1px 1px 0 rgba(0,0,0,0.2)", 
                fontWeight: "800", 
                fontSize: "1.8rem",
                letterSpacing: "-0.5px"
            }}>
                SchoolMoney
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="login-body">
          <Form method="post">
            {(actionData?.error || error) && (
              <p className="login-error">{actionData?.error || error}</p>
            )}

            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input
                type="email"
                name="email"
                className="login-form-input"
                placeholder="Wpisz adres e-mail"
                value={email}
                onChange={(e) =>
                  dispatch({
                    type: "field",
                    fieldName: "email",
                    payload: e.currentTarget.value
                  })
                }
              />
            </div>  

            <div className="form-group">
              <label className="form-label">Hasło *</label>
              <input
                type="password"
                name="password"
                className="login-form-input"
                placeholder="Wpisz hasło"
                autoComplete="new-password"
                value={password}
                onChange={(e) =>
                  dispatch({
                    type: "field",
                    fieldName: "password",
                    payload: e.currentTarget.value
                  })
                }
              />
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </Form>

          <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Nie masz konta?{" "}
            <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}