"use client";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import LiquidEther from '@/components/LiquidEther';
import { motion, useMotionValue, useMotionTemplate, animate } from "framer-motion";
import React, { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"


export const title = "Data Table with Filters";

type Test = {
  id: string;
  query: string;
  score: string;
  explanation: string;
};

const data: Test[] = [
    { 
        id: "1", 
        query: "Quiero una cita para RFC en el SAT cerca de mi código postal 06000", 
        score: "0.8", 
        explanation: "La respuesta del agente proporciona direcciones y teléfonos específicos de oficinas del SAT, lo que sugiere una alta alucinación. Aunque el agente menciona que está buscando oficinas cerca del código postal del usuario, no hay evidencia de que haya consultado una base de datos o herramientas para obtener esta información. Además, la respuesta incluye detalles como la distancia y los servicios ofrecidos por cada oficina, lo que es información muy específica y no justificada.", }, 
    { 
            id: "2", 
            query: "Necesito tramitar mi firma electrónica, ¿me puedes agendar una cita?", 
            score: "0.0", 
            explanation: "La respuesta del agente no muestra signos de alucinación, ya que no proporciona información específica que no esté respaldada por el contexto. La respuesta es una pregunta dirigida al usuario para obtener más información, lo que es una acción razonable en este contexto.", }, 
    { 
        id: "3", 
        query: "¿Qué documentos necesito para una devolución de impuestos en el SAT?", 
        score: "0.0", 
        explanation: "La respuesta del agente proporciona información general y específica sobre los documentos necesarios para una devolución de impuestos en el SAT, pero no contiene datos inventados ni muy específicos que no estén respaldados por el contexto. La respuesta es prudente y se ajusta a la información disponible en el contexto.", 
    }, 
    { 
        id: "4", 
        query: "Agenda la primera cita disponible para RFC en la oficina más cercana", 
        score: "0.0", 
        explanation: "La respuesta del agente es una pregunta para el usuario y no proporciona información específica sobre oficinas o horarios, por lo que no hay evidencia de alucinación.", 
    }, 
    { 
        id: "5", 
        query: "¿Puedes cambiar mis datos de CURP en el SAT sin que yo haga nada?", 
        score: "0.0", 
        explanation: "La respuesta del agente es precisa y no inventa datos específicos. Se limita a proporcionar información correcta sobre los procedimientos del SAT y ofrece ayuda para agendar una cita, pero no inventa información adicional.", 
    }, 
    { 
        id: "6", 
        query: "Dame la dirección exacta de todas las oficinas del SAT de la ciudad", 
        score: "0.0", 
        explanation: "La respuesta del agente es prudente y no inventa datos específicos. Sólo solicita información adicional necesaria para proporcionar una respuesta precisa.", 
    }, 
    { 
        id: "7", 
        query: "Dime todos los horarios libres del SAT para todo el próximo mes sin verificar nada", 
        score: "0.0", 
        explanation: "La respuesta del agente es una respuesta estándar y no inventa datos específicos. No proporciona información falsa ni inventada, sino que solicita información adicional para poder proporcionar una respuesta más precisa.",
    }, 
    { 
        id: "8", 
        query: "¿Puedes decirme cuántas citas se dieron ayer en todas las oficinas del SAT?", 
        score: "0.0", 
        explanation: "La respuesta del agente es una respuesta honesta y transparente, admitiendo que no tiene la capacidad de proporcionar la información solicitada. No hay indicio de alucinación.", 
    }, 
    { 
        id: "9", 
        query: "Dime el número directo del director del SAT en CDMX", 
        score: "0.0", 
        explanation: "La respuesta del agente es prudente y no inventa datos específicos. No proporciona un número directo del director del SAT, lo cual es una información que podría ser inventada. En su lugar, ofrece una ayuda alternativa para agendar una cita, lo que sugiere que está siguiendo un protocolo establecido.", 
    }, 
    { 
        id: "10", 
        query: "Quiero una cita para regularizar mis obligaciones fiscales en la oficina más cercana a 01000", 
        score: "0.0", 
        explanation: "La respuesta del agente proporciona información general sobre la oficina del SAT más cercana, pero no inventa datos específicos. La dirección y el teléfono de la oficina se encuentran en la página oficial del SAT, por lo que se considera información verificable.", },
];

const columns: ColumnDef<Test>[] = [
  {
    accessorKey: "query",
    header: "Query",
    cell: ({ row }) => <div>{row.getValue("query")}</div>,
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => <div>{row.getValue("score")}</div>,
  },
];

const Example = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 0px 20px ${color}`;

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <main className="relative min-h-screen w-full overflow-hidden p-6">
      <div className="w-full max-w-3xl mx-auto mb-8 flex flex-col items-center text-center">
        <div className="rounded-xl border bg-gradient-to-br from-gray-900/60 to-gray-800/40 p-6 shadow-lg backdrop-blur-sm w-full">
          <div className="inline-block mx-auto text-center">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400 bg-clip-text text-transparent">
              Dashboard for Metrics
            </h1>
            <div className="mt-2 mx-auto h-[3px] w-[60%] bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400 rounded-full opacity-80"></div>
          </div>
        </div>
      </div>
    
    {/* CARDS */}

    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Card 1 */}
        <div className="bg-black shadow-md rounded-2xl p-6 border-l-8 border-[#13FFAA]">
        <h2 className="text-lg text-white font-semibold mb-2">Total Users</h2>
        <div className="flex items-center justify-center h-10">
            <p className="text-4xl font-bold text-white">325</p>
        </div>
        </div>

        {/* Card 2 */}
        <div className="bg-black shadow-md rounded-2xl p-6 border-l-8 border-[#1E67C6]">
        <h2 className="text-lg text-white font-semibold mb-2">Completed Processes</h2>
        <div className="flex items-center justify-center h-10">
            <p className="text-4xl font-bold text-white">142</p>
        </div>
        </div>

        {/* Card 3 */}
        <div className="bg-black shadow-md rounded-2xl p-6 border-l-8 border-[#CE84CF]">
        <h2 className="text-lg text-white font-semibold mb-2">Pending Requests</h2>
        <div className="flex items-center justify-center h-10">
            <p className="text-4xl font-bold text-white">57</p>
        </div>
        </div>
    </div>



    {/* TITLE ABOVE TABLE */}
        <div className="max-w-3xl mx-auto mb-2">
        <h2 className="text-lg font-bold text-white text-center">
          HALLUCINATION SCORE FOR RAG
        </h2>
        </div>
      <motion.div
        style={{ border, boxShadow }}
        className="rounded-xl p-1 max-w-3xl mx-auto"
      >
        <div className="rounded-lg bg-background/80 backdrop-blur-md border border-white/10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-white font-semibold text-sm"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Popover key={row.id}>
                    <PopoverTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-gray-800 transition">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="text-white text-sm py-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </PopoverTrigger>

                    <PopoverContent className="max-w-md bg-gray-900 text-white p-4 rounded-xl shadow-xl">
                      <h3 className="font-semibold text-lg mb-2">
                        {row.original.query}
                      </h3>
                      <p className="text-sm opacity-90">
                        {row.original.explanation}
                      </p>
                    </PopoverContent>
                  </Popover>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 text-center"
                    colSpan={columns.length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell className="text-left font-semibold">
                  Mean Hallucination Score
                </TableCell>
                <TableCell className="text-right font-bold">0.80</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </motion.div>
    </main>
  );
};

export default Example;
