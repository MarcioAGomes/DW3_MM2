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
  const [vehicles, setVehicles] = useState([]);

  const placaRef = useRef(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const keys = await window.storage.list('vehicle:');
      if (keys && keys.keys) {
        const loadedVehicles = [];
        for (const key of keys.keys) {
          const result = await window.storage.get(key);
          if (result) {
            loadedVehicles.push(JSON.parse(result.value));
          }
        }
        setVehicles(loadedVehicles);
      }
    } catch (error) {
      console.log('Nenhum veículo cadastrado ainda');
    }
  };

  function validateField(name, value) {
    value = value ?? "";

    switch (name) {
      case "placa": {
        if (!value) return "Placa é obrigatória.";
        const valueLimpo = value.replace(/-/g, '');
        const rePlaca = /^[A-Z]{3}[0-9A-Z]{4,5}$/i;
        if (valueLimpo.length < 4 || valueLimpo.length > 8 || !rePlaca.test(valueLimpo)) {
          return "Placa inválida (ex: ABC1D23 ou ABC-1234).";
        }
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

    if (name === "placa") {
      value = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
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

    const placaLimpa = form.placa.toUpperCase().replace(/-/g, '');

    const payload = {
      placa: placaLimpa,
      marca: form.marca,
      modelo: form.modelo,
      ano: Number(form.ano),
      proprietario: form.proprietario,
      id: `vehicle:${Date.now()}`,
      dataCadastro: new Date().toISOString()
    };

    try {
      await window.storage.set(payload.id, JSON.stringify(payload));
      setResultMessage("Veículo salvo com sucesso!");

      setForm(initialForm);
      setErrors({});
      setTouched({});

      await loadVehicles();

      setTimeout(() => setResultMessage(""), 3000);
    } catch (err) {
      setResultMessage("Falha ao salvar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = async (vehicleId) => {
    try {
      await window.storage.delete(vehicleId);
      await loadVehicles();
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
    }
  };

  return (
    <div className="app">
      <section className="card" aria-labelledby="form-title">
        <h2 id="form-title" className="small">Preencha os dados do veículo</h2>

        <div>
          <div className="form-row">
            <div className="field wide-field">
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
              {(touched.placa && errors.placa)
                ? <div className="error">{errors.placa}</div>
                : <div className="help">Formato: 4–8 caracteres alfanuméricos (exige letras)</div>
              }
            </div>

            <div className="field narrow-field">
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
            <div className="field wide-field">
              <label htmlFor="marca">Marca</label>
              <input
                id="marca"
                name="marca"
                value={form.marca}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ex: Toyota"
              />
              {(touched.marca && errors.marca) && <div className="error">{errors.marca}</div>}
            </div>

            <div className="field medium-field">
              <label htmlFor="modelo">Modelo</label>
              <input
                id="modelo"
                name="modelo"
                value={form.modelo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ex: Corolla"
              />
              {(touched.modelo && errors.modelo) && <div className="error">{errors.modelo}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="proprietario">Proprietário</label>
              <input
                id="proprietario"
                name="proprietario"
                value={form.proprietario}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nome do proprietário"
              />
              {(touched.proprietario && errors.proprietario) && <div className="error">{errors.proprietario}</div>}
            </div>
          </div>

          <div className="actions">
            <button type="button" onClick={handleSubmit} disabled={!isValid || submitting}>
              {submitting ? "Enviando..." : "Salvar"}
            </button>

            <div className="result">
              {resultMessage ? (
                <div style={{ marginTop: 8 }}>{resultMessage}</div>
              ) : (
                (Object.keys(touched).length > 0) && (
                  <span className="small">{isValid ? "Formulário válido" : "Formulário inválido"}</span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {vehicles.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '16px', fontWeight: 500 }}>
            Veículos Cadastrados ({vehicles.length})
          </h2>
          <div className="vehicle-list">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-item">
                <div>
                  <div className="vehicle-info">
                    {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                  </div>
                  <div className="vehicle-details">
                    Ano: {vehicle.ano} | Proprietário: {vehicle.proprietario}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="delete-btn"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}