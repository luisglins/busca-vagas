"use client";

import { useActionState, useTransition } from "react";
import type { IdCategoria, IdPenalidade, Perfil } from "@/lib/tipos";
import { restaurarPadrao, salvarConfiguracoes, type EstadoConfig } from "./acoes";

const NOME_CATEGORIA: Record<IdCategoria, { nome: string; ajuda: string }> = {
  processos: { nome: "Processos e produção", ajuda: "Área principal: engenharia de processos, PCP, qualidade, operações." },
  ia_alto: { nome: "IA aplicada a processos", ajuda: "Automação, agentes, ferramentas no-code." },
  ia_medio: { nome: "IA: implantação e avaliação", ajuda: "Customer success, consultoria, avaliação de modelos." },
  ia_baixo: { nome: "IA: produto", ajuda: "Produto e operações de produto de IA." },
  ferramentas: { nome: "Ferramentas e métodos", ajuda: "Lean, Six Sigma, Power BI, SQL, Python, Excel." },
  contexto: { nome: "Contexto", ajuda: "Indústria, manufatura, supply chain, inglês." },
  nivel: { nome: "Nível de entrada", ajuda: "Trainee, júnior, assistente." },
};

const NOME_PENALIDADE: Record<IdPenalidade, { nome: string; ajuda: string }> = {
  experiencia: { nome: "Pede muita experiência", ajuda: "Ex.: 3 anos, 5+ years." },
  crea: { nome: "Pede CREA", ajuda: "" },
  pleno: { nome: "Nível pleno", ajuda: "" },
  ia_programacao: { nome: "Exige programação", ajuda: "Desenvolvedor, engenheiro de software, ML engineer." },
  remoto_internacional: { nome: "Remoto internacional", ajuda: "Vagas remotas para a América Latina ou o mundo." },
};

function Lista({ nome, valor, linhas = 4, rotulo, ajuda }: { nome: string; valor: string[]; linhas?: number; rotulo: string; ajuda?: string }) {
  return (
    <label className="rotulo">
      {rotulo}
      {ajuda && <span className="text-[13px] font-normal text-aco">{ajuda}</span>}
      <textarea name={nome} rows={linhas} defaultValue={valor.join("\n")} className="campo font-normal" spellCheck={false} />
    </label>
  );
}

function Bloco({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <section className="painel p-5">
      <h2 className="font-titulo text-[22px] font-semibold">{titulo}</h2>
      <p className="mb-4 text-sm text-aco">{descricao}</p>
      {children}
    </section>
  );
}

export function FormularioConfiguracoes({ perfil }: { perfil: Perfil }) {
  const [estado, acao, salvando] = useActionState<EstadoConfig, FormData>(salvarConfiguracoes, { erro: null });
  const [restaurando, iniciar] = useTransition();

  return (
    <form action={acao} className="flex flex-col gap-6">
      <Bloco titulo="Onde procurar" descricao="Uma linha por item. A busca diária usa estas listas.">
        <div className="grid gap-4 md:grid-cols-3">
          <Lista nome="termosBusca" valor={perfil.termosBusca} linhas={8} rotulo="Termos buscados na Gupy" />
          <Lista
            nome="empresasGreenhouse"
            valor={perfil.empresasGreenhouse}
            linhas={8}
            rotulo="Empresas na Greenhouse"
            ajuda="O nome que aparece no endereço boards.greenhouse.io/…"
          />
          <Lista
            nome="empresasAshby"
            valor={perfil.empresasAshby}
            linhas={8}
            rotulo="Empresas na Ashby"
            ajuda="O nome que aparece no endereço jobs.ashbyhq.com/…"
          />
        </div>
      </Bloco>

      <Bloco titulo="O que tirar da lista" descricao="Vagas que batem com estes filtros não aparecem nas Sugestões (ficam guardadas e voltam se você mudar de ideia).">
        <div className="grid gap-4 md:grid-cols-2">
          <Lista
            nome="palavrasEliminatorias"
            valor={perfil.palavrasEliminatorias}
            linhas={8}
            rotulo="Palavras no título que eliminam a vaga"
            ajuda="Ex.: estágio, sênior, gerente. Vagas exclusivas (como as afirmativas) só saem se você incluir a palavra aqui."
          />
          <Lista nome="empresasBloqueadas" valor={perfil.empresasBloqueadas} linhas={8} rotulo="Empresas bloqueadas" />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="aceitarOutrasCidades" defaultChecked={perfil.aceitarOutrasCidades} className="size-4 accent-laranja" />
            Aceitar vagas presenciais em outras cidades
          </label>
          <label className="rotulo w-56">
            Salário mínimo (R$, opcional)
            <input name="salarioMinimo" inputMode="numeric" defaultValue={perfil.salarioMinimo ?? ""} className="campo font-normal" />
          </label>
        </div>
      </Bloco>

      <Bloco titulo="Como a nota é calculada" descricao="Cada grupo soma o peso se uma palavra aparece no título (metade se só na descrição). Acentos e plural não importam.">
        <div className="divide-y divide-junta-leve">
          {perfil.categorias.map((c) => (
            <div key={c.id} className="grid gap-4 py-4 first:pt-0 md:grid-cols-[220px_1fr]">
              <div>
                <p className="font-semibold">{NOME_CATEGORIA[c.id].nome}</p>
                <p className="text-[13px] text-aco">{NOME_CATEGORIA[c.id].ajuda}</p>
                <label className="rotulo mt-2 w-28">
                  Peso
                  <input name={`peso_${c.id}`} type="number" min={0} max={100} defaultValue={c.peso} className="campo num text-lg" />
                </label>
              </div>
              <Lista nome={`palavras_${c.id}`} valor={c.palavras} linhas={5} rotulo="Palavras (uma por linha)" />
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Penalidades" descricao="Pontos que saem da nota quando a vaga tem estas palavras.">
        <div className="divide-y divide-junta-leve">
          {perfil.penalidades.map((p) => (
            <div key={p.id} className="grid gap-4 py-4 first:pt-0 md:grid-cols-[220px_1fr]">
              <div>
                <p className="font-semibold">{NOME_PENALIDADE[p.id].nome}</p>
                {NOME_PENALIDADE[p.id].ajuda && <p className="text-[13px] text-aco">{NOME_PENALIDADE[p.id].ajuda}</p>}
                <label className="rotulo mt-2 w-28">
                  Tira
                  <input name={`valor_${p.id}`} type="number" min={0} max={100} defaultValue={p.valor} className="campo num text-lg" />
                </label>
              </div>
              {p.id === "remoto_internacional" ? (
                <p className="self-center text-sm text-aco">Aplicada pela modalidade da vaga, sem palavras.</p>
              ) : (
                <Lista nome={`palavras_${p.id}`} valor={p.palavras} linhas={4} rotulo="Palavras (uma por linha)" />
              )}
            </div>
          ))}
        </div>
      </Bloco>

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center gap-4 border-t border-junta bg-concreto/95 px-6 py-4">
        <button type="submit" className="btn btn-principal" disabled={salvando || restaurando}>
          {salvando ? "Salvando e recalculando…" : "Salvar e recalcular notas"}
        </button>
        <button
          type="button"
          className="btn-texto"
          disabled={salvando || restaurando}
          onClick={() => {
            if (confirm("Voltar todas as configurações para o padrão? As listas que você editou serão perdidas.")) {
              iniciar(async () => {
                await restaurarPadrao();
                window.location.reload();
              });
            }
          }}
        >
          {restaurando ? "Restaurando…" : "Restaurar padrão"}
        </button>
        {estado.mensagem && !salvando && (
          <p className="text-sm text-verde" aria-live="polite">
            {estado.mensagem}
          </p>
        )}
        {estado.erro && (
          <p role="alert" className="text-sm text-vermelho">
            {estado.erro}
          </p>
        )}
      </div>
    </form>
  );
}
