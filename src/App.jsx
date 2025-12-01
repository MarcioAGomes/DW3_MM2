import React from "react";
import VehicleForm from "./components/VehicleForm";

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Sistema Norteador — Cadastro de Veículos</h1>
      </header>
      <main>
        <VehicleForm />
      </main>
    </div>
  );
}