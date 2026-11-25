import { QuadroCarregado } from "../carregar-quadro";

// Vagas que chegam pelos alertas do LinkedIn no Gmail (nota pelo nome da vaga).
export default function LinkedIn() {
  return <QuadroCarregado modo="email" />;
}
