import { useState } from "react";
import { Card, CardContent } from "@/components/card";
import { Button } from "@/components/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from "xlsx";

const membrosPleno = [
  "Rodolpho Zahluth Bastos",
  "Lilia Márcia Ramos Reis",
  "Fabricio Drago Pinho Júnior",
  "Marcelo Augusto Moreno da Silva Alves",
  "Luciene Mota de Leão Chaves",
  "Raul Protázio Romão",
  "Giovanni Nogueira Glins",
  "teste",
];

const administrador = "Giovanni Nogueira Glins";

export default function PlenariaApp() {
  const [processos, setProcessos] = useState([]);
  const [processoSelecionado, setProcessoSelecionado] = useState(null);
  const [usuario, setUsuario] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [planilhaCarregada, setPlanilhaCarregada] = useState(false);

  const selecionarProcesso = (idStr) => {
    const id = Number(idStr);
    const proc = processos.find((p) => p.id === id);
    setProcessoSelecionado(proc);
    setMostrarMotivo(false);
    setMotivoRejeicao("");
  };

  const registrarVoto = (voto) => {
    if (!processoSelecionado || !usuario) return;
    if (voto === "contra" && !motivoRejeicao) return;

    const atualizado = processos.map((p) => {
      if (p.id !== processoSelecionado.id) return p;

      const novosVotos = [
        ...(p.votos || []),
        {
          membro: usuario,
          voto,
          motivo: voto === "contra" ? motivoRejeicao : null,
        },
      ];

      const todosVotaram = membrosPleno.every((m) =>
        novosVotos.some((v) => v.membro === m)
      );

      return {
        ...p,
        votos: novosVotos,
        status: todosVotaram ? "finalizado" : "pendente",
      };
    });

    setProcessos(atualizado);
    setProcessoSelecionado(null);
    setMotivoRejeicao("");
    setMostrarMotivo(false);
  };

  const processosRestantes = processos.filter(
    (p) => !(p.votos && p.votos.some((v) => v.membro === usuario))
  );

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processosConvertidos = jsonData.map((row, index) => ({
        id: row["ID"] || index + 1,
        numero: row["Número do Processo"] || N/A-${index + 1},
        resumo: row["Resumo"] || "Sem resumo",
        parecer: row["Parecer Técnico"] || "Sem parecer",
        sugestao: row["Sugestão de Julgamento"] || "Sem sugestão",
        status: "pendente",
        votos: [],
      }));

      setProcessos(processosConvertidos);
      setPlanilhaCarregada(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const autenticarUsuario = () => {
    const nomesValidos = [administrador, ...membrosPleno];
    if (nomesValidos.includes(nomeInput) && senha === "1234") {
      setUsuario(nomeInput);
      setAutenticado(true);
    } else {
      alert("Nome ou senha incorretos.");
    }
  };

  const exportarResultados = () => {
    const dadosExportados = processos.map((proc) => ({
      "Número do Processo": proc.numero,
      Resumo: proc.resumo,
      "Parecer Técnico": proc.parecer,
      "Sugestão de Julgamento": proc.sugestao,
      ...Object.fromEntries(
        (proc.votos || []).map((v, i) => [
          Voto ${i + 1},
          ${v.membro}: ${v.voto === "favor" ? "Aprovou" : Rejeitou (${v.motivo || "Sem motivo especificado"})},
        ])
      ),
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_plenaria.xlsx");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-extrabold text-center text-white mb-4">Plenária de Julgamento</h1>

      {!planilhaCarregada ? (
        <div className="mb-6 bg-gray-800 shadow-md rounded p-4">
          <label className="block mb-2 font-semibold text-lg text-white">Carregar planilha Excel:</label>
          <input type="file" accept=".xlsx, .xls" onChange={handleUpload} className="p-2 border rounded w-full bg-gray-700 text-white" />
        </div>
      ) : !autenticado ? (
        <div className="space-y-4 max-w-md bg-gray-800 shadow-md rounded p-6 mx-auto">
          <p className="text-lg font-medium text-white">Insira seu nome e senha para acessar:</p>
          <input
            type="text"
            placeholder="Nome"
            className="w-full border px-3 py-2 rounded bg-gray-700 text-white"
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full border px-3 py-2 rounded bg-gray-700 text-white"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Button className="w-full" onClick={autenticarUsuario}>Entrar</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-right text-gray-400">
            Usuário autenticado: <strong>{usuario}</strong>
          </p>

          {usuario !== administrador && processos.length > 0 && processosRestantes.length > 0 && (
            <div className="flex flex-wrap gap-4 justify-center">
              {processosRestantes.map((proc) => (
                <Button key={proc.id} onClick={() => selecionarProcesso(proc.id.toString())}>
                  {proc.id} - {proc.numero}
                </Button>
              ))}
            </div>
          )}

          {usuario !== administrador && processos.length > 0 && processosRestantes.length === 0 && (
            <p className="text-green-600 font-medium text-center">Você já votou em todos os processos.</p>
          )}

          {usuario !== administrador && processoSelecionado && (
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="space-y-4 pt-6">
                <h2 className="text-2xl font-bold text-blue-700">
                  Processo {processoSelecionado.numero}
                </h2>
                <p><strong>Resumo:</strong> {processoSelecionado.resumo}</p>
                <p><strong>Parecer Técnico:</strong> {processoSelecionado.parecer}</p>
                <p><strong>Sugestão de Julgamento:</strong> {processoSelecionado.sugestao}</p>

                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button className="flex-1" onClick={() => registrarVoto("favor")}>Aprovar parecer</Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => setMostrarMotivo(true)}
                    >
                      Rejeitar parecer
                    </Button>
                  </div>

                  {mostrarMotivo && (
                    <div className="bg-gray-100 p-4 rounded text-black">
                      <label className="block mb-2 font-medium">
                        Motivo da rejeição (obrigatório):
                      </label>
                      <Select onValueChange={setMotivoRejeicao} value={motivoRejeicao}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o motivo da rejeição" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="majorar">Majorar</SelectItem>
                          <SelectItem value="minorar">Minorar</SelectItem>
                          <SelectItem value="manter o PJ">Manter o PJ</SelectItem>
                          <SelectItem value="cancelar o auto">Cancelar o auto</SelectItem>
                          <SelectItem value="baixar em diligencia">Baixar em diligência</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="mt-4 flex space-x-4">
                        <Button
                          className="flex-1"
                          variant="destructive"
                          onClick={() => registrarVoto("contra")}
                          disabled={!motivoRejeicao}
                        >
                          Confirmar rejeição
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => setMostrarMotivo(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {usuario === administrador && (
            <div className="mt-12 bg-white p-6 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">
                Resumo dos Votos (Somente para Administrador)
              </h2>
              <Button className="mb-6" onClick={exportarResultados}>
                Exportar Resultados
              </Button>
              {processos.map((proc) => (
                <Card key={proc.id} className="mb-4">
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg text-gray-700">{proc.numero}</h3>
                    <p className="text-sm text-gray-600">{proc.resumo}</p>
                    <p className="text-sm italic text-gray-500">Sugestão: {proc.sugestao}</p>
                    <div className="mt-2">
                      {proc.votos && proc.votos.length > 0 ? (
                        <ul className="list-disc pl-6">
                          {proc.votos.map((v, i) => (
                            <li key={i}>
                              {v.membro}: {v.voto === "favor" ? "Aprovou" : Rejeitou (${v.motivo || "Sem motivo especificado"})}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">Nenhum voto registrado.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
