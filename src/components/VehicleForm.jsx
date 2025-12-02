import React, { useState, useEffect, useRef } from "react";

const currentYear = new Date().getFullYear();

const initialForm = {
  placa: "",
  marca: "",
  modelo: "",
  ano: "",
  proprietario: ""
};

export default function VehicleForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  
  const [touched, setTouched] = useState({}); 

  const placaRef = useRef(null);

  function validateField(name, value) {
    value = value ?? "";

    switch (name) {
      case "placa": {
        const re = /^[A-Z0-9-]{4,8}$/i;
        if (!value) return "Placa é obrigatória.";
        if (!re.test(value) && value) return "Placa inválida (use 4-8 caracteres alfanuméricos).";
        return "";
      }
      case "marca":
        if (!value) return "Marca é obrigatória.";
        if (value.length < 2) return "Marca muito curta.";
        return "";
      case "modelo":
        if (!value) return "Modelo é obrigatório.";
        if (value.length < 1) return "Modelo muito curto.";
        return "";
      case "ano": {
        if (!value) return "Ano é obrigatório.";
        const n = Number(value);
        if (Number.isNaN(n)) return "Ano deve ser numérico.";
        if (n < 1886 || n > currentYear + 1) return `Ano inválido (entre 1886 e ${currentYear + 1}).`;
        return "";
      }
      case "proprietario":
        if (!value) return "Proprietário é obrigatório.";
        if (value.length < 3) return "Informe ao menos 3 caracteres para o proprietário.";
        return "";
      default:
        return "";
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const message = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
  }

  function handleChange(e) {
    let { name, value } = e.target;
    
    if (name === "ano") {
        value = value.replace(/[^0-9]/g, ''); 
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));

    const message = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
  }

  useEffect(() => {
    placaRef.current?.focus();
  }, []);

  useEffect(() => {
    const nextErrors = {};
    Object.keys(initialForm).forEach((k) => {
      nextErrors[k] = validateField(k, form[k]);
    });
    
    const anyError = Object.values(nextErrors).some((m) => m && m.length > 0);
    setIsValid(!anyError);
  }, [form]);

  async function handleSubmit(e) {
    e.preventDefault();
    setResultMessage("");

    const finalTouched = Object.keys(initialForm).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(finalTouched); 
    
    const finalErrors = {};
    Object.keys(initialForm).forEach((k) => {
      finalErrors[k] = validateField(k, form[k]);
    });
    setErrors(finalErrors);

    const hasError = Object.values(finalErrors).some((m) => m && m.length > 0);
    if (hasError) {
      setResultMessage("Corrija os erros antes de salvar.");
      return;
    }
    
    setSubmitting(true);

    const payload = {
      placa: form.placa.toUpperCase(),
      marca: form.marca,
      modelo: form.modelo,
      ano: Number(form.ano),
      proprietario: form.proprietario
    };

    try {
      const resp = await fetch("/api/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        let text;
        try {
          text = await resp.text();
        } catch {
          text = "";
        }
        setResultMessage(`Erro na requisição: ${resp.status} ${resp.statusText} ${text ? "- " + text : ""}`);
      } else {
        const data = await resp.json().catch(() => null);
        setResultMessage("Veículo salvo com sucesso." + (data ? " Resposta: " + JSON.stringify(data) : ""));
        setForm(initialForm);
        setTouched({}); 
      }
    } catch (err) {
      setResultMessage("Falha ao enviar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <section className="card" aria-labelledby="form-title">
      <h2 id="form-title" className="small">Preencha os dados do veículo</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label htmlFor="placa">Placa</label>
            <input
              id="placa"
              name="placa"
              value={form.placa}
              onChange={handleChange}
              onBlur={handleBlur} 
              placeholder="ex: ABC-1234"
              maxLength={8}
              ref={placaRef} 
            />
            {(touched.placa && errors.placa) ? <div className="error">{errors.placa}</div> : <div className="help">Formato: 4–8 caracteres alfanuméricos</div>}
          </div>

          <div className="field">
            <label htmlFor="ano">Ano</label>
            <input 
              id="ano" 
              name="ano" 
              value={form.ano} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              placeholder="ex: 2023"
              inputMode="numeric" 
            />
            {(touched.ano && errors.ano) && <div className="error">{errors.ano}</div>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="field">
            <label htmlFor="marca">Marca</label>
            <input id="marca" name="marca" value={form.marca} onChange={handleChange} onBlur={handleBlur} placeholder="ex: Toyota" />
            {(touched.marca && errors.marca) && <div className="error">{errors.marca}</div>}
          </div>

          <div className="field">
            <label htmlFor="modelo">Modelo</label>
            <input id="modelo" name="modelo" value={form.modelo} onChange={handleChange} onBlur={handleBlur} placeholder="ex: Corolla" />
            {(touched.modelo && errors.modelo) && <div className="error">{errors.modelo}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="proprietario">Proprietário</label>
            <input id="proprietario" name="proprietario" value={form.proprietario} onChange={handleChange} onBlur={handleBlur} placeholder="Nome do proprietário" />
            {(touched.proprietario && errors.proprietario) && <div className="error">{errors.proprietario}</div>}
          </div>
        </div>

        <div className="actions">
          <button type="submit" disabled={!isValid || submitting}>
            {submitting ? "Enviando..." : "Salvar"}
          </button>

          <div className="result">
            <span className="small">{isValid ? "Formulário válido" : "Formulário inválido"}</span>
            {resultMessage && <div style={{ marginTop: 8 }}>{resultMessage}</div>}
          </div>
        </div>
      </form>
    </section>
  );
}