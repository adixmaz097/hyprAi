"use client";
import { signIn } from "next-auth/react";
import './signstyle.css';
export default function SignIn() {
  return (
    <div className="signin-container">
      <h1 className="signin-title">Chitti - Login</h1>
      <button
        onClick={() => signIn("google")}
        className="signin-button"
      >
        Sign in with Google
      </button>
    </div>
  );
}
