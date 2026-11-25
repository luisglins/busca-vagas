import { describe, expect, it } from "vitest";
import { validarPdf } from "@/lib/arquivo";

const MB = 1024 * 1024;

describe("validarPdf", () => {
  it("aceita PDF de 1 MB", () => {
    expect(validarPdf({ name: "cv.pdf", type: "application/pdf", size: 1 * MB })).toBeNull();
  });
  it("recusa imagem", () => {
    expect(validarPdf({ name: "foto.png", type: "image/png", size: 1 * MB })).toBe("Envie um arquivo PDF.");
  });
  it("recusa PDF maior que 5 MB", () => {
    expect(validarPdf({ name: "cv.pdf", type: "application/pdf", size: 6 * MB })).toBe("O arquivo passa de 5 MB.");
  });
  it("aceita extensão .PDF maiúscula", () => {
    expect(validarPdf({ name: "CV.PDF", type: "application/pdf", size: 1 * MB })).toBeNull();
  });
  it("recusa arquivo vazio", () => {
    expect(validarPdf({ name: "cv.pdf", type: "application/pdf", size: 0 })).toBe("Escolha um arquivo PDF.");
  });
});
