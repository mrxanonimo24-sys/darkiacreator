import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up body parsing limits to accommodate image/video base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database JSON path
const dbPath = path.join(process.cwd(), "db.json");

// Initialize database with default generated images
function initDatabase() {
  const defaultImages = [
    {
      id: "1",
      filename: "avatar_cyber_pink.jpg",
      originalPath: "/src/assets/images/avatar_cyber_pink_1782489294122.jpg",
      title: "Cyberpunk Creator Pink",
      category: "Cyberpunk",
      isPublic: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      filename: "avatar_abstract_sphere.jpg",
      originalPath: "/src/assets/images/avatar_abstract_sphere_1782489307282.jpg",
      title: "Glossy Abstract Sphere",
      category: "Minimalista",
      isPublic: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      filename: "avatar_ai_core.jpg",
      originalPath: "/src/assets/images/avatar_ai_core_1782489325331.jpg",
      title: "Quantum AI Core",
      category: "IA",
      isPublic: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Try to copy default assets from generation path into uploads if they exist and are not copied
  defaultImages.forEach((img) => {
    const destPath = path.join(uploadsDir, img.filename);
    if (!fs.existsSync(destPath)) {
      const srcPath = path.join(process.cwd(), img.originalPath);
      if (fs.existsSync(srcPath)) {
        try {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Successfully copied default asset: ${img.filename}`);
        } catch (err) {
          console.error(`Error copying default asset ${img.filename}:`, err);
        }
      }
    }
  });

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ images: defaultImages, captions: [] }, null, 2));
    console.log("Database initialized with default images and captions.");
  } else {
    // If db exists but files are missing in uploads, make sure we merge or fix
    try {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      let updated = false;
      if (!db.images || db.images.length === 0) {
        db.images = defaultImages;
        updated = true;
      }
      if (!db.captions) {
        db.captions = [];
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      }
    } catch (e) {
      fs.writeFileSync(dbPath, JSON.stringify({ images: defaultImages, captions: [] }, null, 2));
    }
  }
}

initDatabase();

// Get the Gemini Client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI functionality will fallback to simulated legends.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Serve uploads folder static
app.use("/uploads", express.static(uploadsDir));

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 1. AI Caption Generator API
app.post("/api/legendas/gerar", async (req, res) => {
  const { username, context, fileName, fileData, mimeType } = req.body;

  if (!username) {
    return res.status(400).json({ error: "O @ do Instagram é obrigatório." });
  }

  const cleanUsername = username.startsWith("@") ? username : `@${username}`;

  // Helper to generate context-aware simulated captions based exactly on the requested GTA base structure
  const generatePremiumCaption = (user: string, ctx?: string, file?: string) => {
    const usr = user.startsWith("@") ? user : `@${user}`;
    const norm = ((ctx || "") + " " + (file || "")).toLowerCase();    // If context matches gaming/gta/pc or is empty, provide an extremely polished gaming story
    if (!ctx || norm.includes("gta") || norm.includes("game") || norm.includes("console") || norm.includes("pc") || norm.includes("rockstar") || norm.includes("lançamento")) {
      return `Faz isso não. 😂

Anos esperando o lançamento do GTA e quando finalmente chega a hora, vem aquela notícia que divide a internet: o jogo vai sair primeiro apenas para consoles.

Quem joga no PC já conhece essa história. Começa a espera, aparecem teorias, rumores, vídeos analisando cada detalhe e uma ansiedade enorme para finalmente poder jogar.

While isso, quem está nos consoles já está explorando o mapa, descobrindo segredos e compartilhando tudo nas redes sociais, deixando quem joga no PC ainda mais impaciente.

Mas olhando pelo lado da empresa, a estratégia faz sentido. A Rockstar sabe que existe uma comunidade gigante no PC, mas também sabe que o lançamento inicial é um dos momentos mais importantes.

Quando um jogo desse tamanho chega, milhões de pessoas querem jogar no primeiro dia. Lançar primeiro nos consoles ajuda a garantir um impacto enorme nas vendas e no alcance do jogo.

Além disso, existe toda a questão da pirataria, modificações e arquivos compartilhados. Um lançamento no PC logo de cara poderia facilitar que algumas pessoas tentassem disponibilizar versões ilegais rapidamente.

Também tem outro ponto: a comunidade de PC costuma criar mods, melhorias e várias mudanças que transformam a experiência do jogo. A Rockstar sabe que quando essa versão chegar, a internet vai ficar cheia de novas possibilidades.

No fim, parece até uma tradição.

Primeiro vem a espera pelo anúncio.

Depois vem a espera pelo lançamento.

E depois vem a espera pela versão de PC.

Mas uma coisa é certa: a Rockstar sabe criar expectativa como poucas empresas. Cada trailer, imagem ou detalhe vira assunto no mundo inteiro.

E quando finalmente chegar no PC, muita gente que reclamou da demora provavelmente vai estar jogando do mesmo jeito.

• Já segue o perfil pra ficar por dentro das novidades. 🚀

${usr}

#games #meme #fy #viral`;
    }

    // Context is programming / code / tech
    if (norm.includes("program") || norm.includes("dev") || norm.includes("código") || norm.includes("ti") || norm.includes("bug") || norm.includes("computador") || norm.includes("software")) {
      return `Faz isso não. 😂

Anos estudando programação, criando projetos e quando finalmente você acha que dominou a linguagem, vem aquela atualização ou um bug inexplicável que divide a internet e sua sanidade.

Quem trabalha com TI já conhece essa história. Começa a busca pelo erro, aparecem teorias loucas no StackOverflow, dezenas de abas abertas no navegador e uma ansiedade enorme para finalmente ver o build rodando liso.

Enquanto isso, quem não é da área acha que criar sistemas é super fácil, compartilha inteligências artificiais gerando tudo em segundos e deixa qualquer programador experiente ainda mais impaciente.

Mas olhando pelo lado da engenharia de software, a complexidade faz todo sentido. Criar uma aplicação robusta exige arquitetura limpa, testes de ponta a ponta e o entendimento de que a estabilidade é o fator mais importante.

Quando uma plataforma desse tamanho entra em produção, milhões de requisições simultâneas acontecem no primeiro dia. Lançar com calma e em fases controladas ajuda a evitar gargalos catastróficos.

Além disso, existe toda a questão de brechas de segurança, refatoração de código legado e testes de carga. Um deploy apressado logo de cara poderia comprometer dados e gerar reclamações pesadas dos usuários.

Também tem outro ponto: a comunidade de desenvolvimento adora criar integrações adicionais, melhorias open-source e otimizações fantásticas. A equipe de produto sabe que quando a versão final estiver consolidada, o ecossistema estará muito mais rico.

No fim, parece até uma tradição.

Primeiro vem a espera pelo café fresquinho.

Depois vem a busca pelo erro invisível no console.

E depois vem a espera pelo deploy final em produção.

Mas uma coisa é certa: a tecnologia sabe transformar problemas complexos em soluções elegantes como poucas coisas no mundo. Cada linha de lógica vira impacto real para milhares de pessoas.

E quando finalmente tudo estiver funcionando em perfeito estado, muita gente que criticou o tempo de desenvolvimento vai estar utilizando e elogiando a ferramenta do mesmo jeito.

• Já segue o perfil pra ficar por dentro das novidades. 🚀

${usr}

#programacao #tecnologia #fy #viral`;
    }

    // Context is motivation / focus / success
    if (norm.includes("motiva") || norm.includes("foco") || norm.includes("disciplina") || norm.includes("sucesso") || norm.includes("mentalidade") || norm.includes("evolução") || norm.includes("rotina")) {
      return `Faz isso não. 😂

Anos planejando o momento perfeito para mudar de vida, começar aquele projeto promissor ou focar nos treinos, e quando finalmente decide agir, vem aquele dia difícil que divide sua mente e foco.

Quem busca desenvolvimento pessoal já conhece essa história. Começa o entusiasmo inicial, surgem teorias de hábitos milagrosos, vídeos de rotinas perfeitas às 5 da manhã e uma ansiedade gigantesca por resultados rápidos.

Enquanto isso, quem já possui anos de constância sólida está colhendo frutos visíveis, mostrando conquistas diárias nas redes e deixando quem está começando a jornada ainda mais impaciente.

Mas olhando pelo lado do crescimento real, o tempo de maturação faz todo sentido. A mente humana sabe que o hábito verdadeiro não se cria do dia para a noite, e que a consistência silenciosa é o fator mais importante.

Quando uma grande virada de chave acontece, seu cérebro tenta sabotar o progresso logo na primeira semana. Resistir aos impulsos iniciais ajuda a garantir que a nova identidade seja sustentável e duradoura.

Além disso, existe toda a questão de lidar com antigas distrações e ambientes desfavoráveis. Tentar mudar radicalmente tudo de uma só vez logo no início costuma causar cansaço extremo e desistências precoces.

Também tem outro ponto: pessoas disciplinadas constroem rituais diários simples, focando em pequenas vitórias que acumulam ao longo do tempo. Você sabe que quando os resultados começarem a aparecer, sua vida inteira mudará de nível.

No fim, parece até uma tradição.

Primeiro vem a espera pelo dia ideal de começar.

Depois vem o peso de manter a consistência diária.

E depois vem a colheita dos resultados extraordinários.

Mas uma coisa é certa: a disciplina gera uma liberdade que nenhuma motivação temporária consegue entregar. Cada escolha consciente hoje é um degrau rumo ao seu objetivo.

E quando você finalmente alcançar suas maiores metas e olhar para trás, muita gente que criticava seu ritmo provavelmente vai dizer que foi pura sorte do mesmo jeito.

• Já segue o perfil pra ficar por dentro das novidades. 🚀

${usr}

#motivacao #foco #fy #viral`;
    }

    // Custom Context Dynamic Fallback using the requested structure perfectly
    const capitalizedCtx = ctx ? (ctx.charAt(0).toUpperCase() + ctx.slice(1)) : "Criação";
    const words = ctx ? ctx.split(/[\s,._-]+/).filter(w => w.length > 2).slice(0, 2) : [];
    const tag1 = words[0] ? `#${words[0].toLowerCase()}` : "#criador";
    const tag2 = words[1] ? `#${words[1].toLowerCase()}` : "#conteudo";
    return `Faz isso não. 😂

Anos esperando o momento ideal para dominar completamente sobre ${ctx || "seu conteúdo"} e quando finalmente chega a oportunidade, surge aquela dúvida ou obstáculo que divide as opiniões: a excelência exige tempo de maturação.

Quem estuda e atua nessa área já conhece essa história. Começa a busca profunda por conhecimento, surgem dezenas de teorias, tutoriais infinitos e uma ansiedade enorme para ver os resultados práticos acontecerem.

Enquanto isso, quem já é especialista está executando os processos com extrema maestria, compartilhando segredos avançados e deixando quem está no início da curva de aprendizado ainda mais impaciente.

Mas olhando sob uma perspectiva estratégica, esse período de adaptação faz todo sentido. A prática consolidada exige uma base muito bem estabelecida, sendo o foco nos detalhes um dos momentos mais importantes.

Quando um projeto ou aprendizado dessa magnitude se inicia, milhares de variáveis precisam ser testadas e ajustadas no início. Seguir as etapas com atenção ajuda a garantir um resultado infinitos metros acima da média.

Além disso, existe toda a questão de refinar a qualidade técnica, evitar erros bobos de execução e receber feedbacks reais. Tentar pular fases sem consistência logo de cara poderia expor falhas críticas que seriam difíceis de corrigir depois.

Também tem outro ponto: a comunidade costuma desenvolver hacks inteligentes, otimizações de processo e melhorias constantes que transformam totalmente o fluxo. Você sabe que quando dominar essa competência, seu dia a dia ficará cheio de novas possibilidades.

No fim, parece até uma tradição.

Primeiro vem a espera pela oportunidade perfeita.

Depois vem o esforço da primeira tentativa real.

E depois vem o reconhecimento do sucesso consolidado.

Mas uma coisa é certa: o conhecimento especializado e a consistência trazem uma clareza que poucas coisas na vida conseguem oferecer. Cada pequeno aprendizado se torna um diferencial de altíssimo nível.

E quando você finalmente estiver colhendo os louros do seu trabalho árduo, muita gente que achava que não valia a pena provavelmente vai estar pedindo conselhos do mesmo jeito.

• Já segue o perfil pra ficar por dentro das novidades. 🚀

${usr}

${tag1} ${tag2} #fy #viral`;
  };

  // If there's no GEMINI_API_KEY or it's a mock key, use our high-quality premium generator
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log("Using dynamic premium fallback caption generation conforming to requested structure.");
    const simulatedCaption = generatePremiumCaption(cleanUsername, context, fileName);
    return res.json({ caption: simulatedCaption, isSimulated: true });
  }

  try {
    const ai = getGeminiClient();
    
    const parts: any[] = [];
    if (fileData) {
      let base64Data = fileData;
      let finalMimeType = mimeType || "video/mp4";
      if (fileData.includes(";base64,")) {
        const matches = fileData.match(/^data:(.*);base64,(.*)$/);
        if (matches && matches.length === 3) {
          finalMimeType = matches[1];
          base64Data = matches[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType: finalMimeType,
          data: base64Data,
        },
      });
    }

    // Construct Prompt with detailed instructions to mimic the user's base caption structure
    let prompt = `Você é um copywriter de altíssima performance, especialista em marketing digital e copywriting viral para Instagram, com foco em engajamento estético e alta conversão.

Gere uma legenda altamente magnética, engajadora e otimizada para o Instagram do usuário.

INSTRUÇÃO MÁXIMA - ANALISE O VÍDEO REAL ENVIADO:
Você recebeu um arquivo de vídeo real nos dados em anexo. Você deve analisar cuidadosamente esse vídeo: identifique as cenas reais, as expressões faciais da pessoa, os gestos, as ações físicas (se ela está apontando, digitando, sorrindo, mexendo no celular, com as mãos na cabeça, etc.), o que é mostrado na tela (código, jogo, site, etc.) e os objetos ao redor.
Sua legenda deve ser inspirada diretamente no que está acontecendo VISUALMENTE e FISICAMENTE no vídeo enviado. Não use apenas o título ou o contexto digitado; conecte a narrativa de forma genial e inteligente com as imagens reais do vídeo que você acabou de assistir.

Você DEVE se inspirar e utilizar RIGOROSAMENTE a seguinte BASE DE LEGENDA como modelo supremo de estilo, tom irônico/humorado/fluido, espaçamento de parágrafos e fluxo narrativo:

--- BASE DE LEGENDA DE REFERÊNCIA ---
Faz isso não. 😂

Anos esperando o lançamento do GTA e quando finalmente chega a hora, vem aquela notícia que divide a internet: o jogo vai sair primeiro apenas para consoles.

Quem joga no PC já conhece essa história. Começa a espera, aparecem teorias, rumores, vídeos analisando cada detalhe e uma ansiedade enorme para finalmente poder jogar.

Enquanto isso, quem está nos consoles já está explorando o mapa, descobrindo segredos e compartilhando tudo nas redes sociais, deixando quem joga no PC ainda mais impaciente.

Mas olhando pelo lado da empresa, a estratégia faz sentido. A Rockstar sabe que existe uma comunidade gigante no PC, mas também sabe que o lançamento inicial é um dos momentos mais importantes.

Quando um jogo desse tamanho chega, milhões de pessoas querem jogar no primeiro dia. Lançar primeiro nos consoles ajuda a garantir um impacto enorme nas vendas e no alcance do jogo.

Além disso, existe toda a questão da pirataria, modificações e arquivos compartilhados. Um lançamento no PC logo de cara poderia facilitar que algumas pessoas tentassem disponibilizar versões ilegais rapidamente.

Também tem outro ponto: a comunidade de PC costuma criar mods, melhorias e várias mudanças que transformam a experiência do jogo. A Rockstar sabe que quando essa versão chegar, a internet vai ficar cheia de novas possibilidades.

No fim, parece até uma tradição.

Primeiro vem a espera pelo anúncio.

Depois vem a espera pelo lançamento.

E depois vem a espera pela versão de PC.

Mas uma coisa é certa: a Rockstar sabe criar expectativa como poucas empresas. Cada trailer, imagem ou detalhe vira assunto no mundo inteiro.

E quando finalmente chegar no PC, muita gente que reclamou da demora provavelmente vai estar jogando do mesmo jeito.

• Já segue o perfil pra ficar por dentro das novidades. 🚀

@usuario_aqui

#hashtags_aqui
--- FIM DA BASE DE LEGENDA ---

DIRETRIZES DE CRIAÇÃO E ADAPTAÇÃO:
1. Comece com uma frase inicial de impacto brincalhona/irônica acompanhada de um emoji divertido no mesmo tom de "Faz isso não. 😂".
2. Desenvolva o corpo do texto de forma extremamente fluida e envolvente, usando parágrafos curtos (com no máximo 2-3 sentenças cada) separados por exatamente uma linha em branco. Nunca use listas com marcadores (bullets), traços ou números no corpo. Conte uma história instigante que conecte a ação real vista no vídeo com o nicho ou tema sugerido pelo criador.
3. Insira perto do final a cadência rítmica clássica da nossa base de referência, estruturada exatamente em 3 parágrafos curtos consecutivos e de 1 linha cada:
   "No fim, parece até uma tradição.
   
   Primeiro vem a espera por... [adaptado à ação do vídeo/contexto]
   
   Depois vem a espera por... [adaptado à ação do vídeo/contexto]
   
   E depois vem a espera por... [adaptado à ação do vídeo/contexto]"
4. Termine com um parágrafo de fechamento provocativo no mesmo tom de: "Mas uma coisa é certa: [conclusão sobre o tema]. E quando [ponto de virada], muita gente que reclamou provavelmente estará participando do mesmo jeito."
5. Adicione o rodapé abaixo, preenchendo o nome de usuário com o @ do criador informado. No final, crie EXATAMENTE de 1 a 2 hashtags personalizadas e muito relevantes criadas com base no que está acontecendo visivelmente no vídeo enviado e no nicho do conteúdo, seguidas OBRIGATORIAMENTE e FIXAMENTE pelas duas hashtags #fy e #viral. O formato final das hashtags na última linha da legenda deve ser obrigatoriamente: #<tag_do_video_1> #<tag_do_video_2> #fy #viral (gerando no máximo 4 hashtags no total, sendo 2 do vídeo e as 2 fixas). Não inclua nenhuma outra hashtag extra além destas.

• Já segue o perfil pra ficar por dentro das novidades. 🚀

${cleanUsername}

#<tag_do_video_1> #<tag_do_video_2> #fy #viral

DETALHES DO CONTEÚDO ENVIADO PARA REFERÊNCIA E NICHO:
- Nome do arquivo de vídeo enviado: "${fileName || "video_criador.mp4"}"
- Contexto ou Nicho fornecido pelo criador: "${context || "Criação de conteúdo estratégico"}"

Gere apenas a legenda final pronta para uso, sem nenhuma introdução sua ou textos adicionais fora da legenda.`;

    parts.push({
      text: prompt,
    });

    // Call Gemini with stable models and fast-fallback mechanism
    let response: any = null;
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    ];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting caption generation with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: parts,
          },
          config: {
            systemInstruction: "Você é um especialista em marketing digital e copywriting viral para Instagram, focado em alta conversão e engajamento estético. Seu objetivo é analisar o vídeo real fornecido e o contexto informado para criar uma legenda incrível sobre a situação real mostrada no vídeo, baseada no estilo do modelo.",
            temperature: 0.85,
          }
        });
        
        if (response && response.text) {
          console.log(`Successfully generated caption using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code || 0;
        console.log(`Model ${modelName} failed (status ${status}). Trying next model...`);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Todos os modelos de IA falharam ou retornaram respostas vazias.");
    }

    const captionText = response.text || "";
    saveCaptionToDb(cleanUsername, context, fileName, captionText);
    return res.json({ caption: captionText, isSimulated: false });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.log(`[Gemini API API/Quota Info] Switching to local copywriting engine because standard API returned: "${errorMsg.slice(0, 150)}"`);
    
    // Fallback exactly to our dynamic premium template
    const fallbackCaption = generatePremiumCaption(cleanUsername, context, fileName);
    saveCaptionToDb(cleanUsername, context, fileName, fallbackCaption);

    return res.json({ 
      caption: fallbackCaption, 
      isSimulated: true, 
      message: "Ativamos nosso modelo de copywriting premium de contingência devido à alta demanda nos servidores da IA principal." 
    });
  }
});

// Helper to save a caption to the database
function saveCaptionToDb(username: string, context: string, fileName: string, caption: string) {
  try {
    if (!fs.existsSync(dbPath)) return null;
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    if (!db.captions) {
      db.captions = [];
    }
    const newCaption = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      username: username || "@criador",
      context: context || "",
      fileName: fileName || "",
      caption: caption || "",
      createdAt: new Date().toISOString()
    };
    db.captions.unshift(newCaption);
    // Limit to latest 50 entries
    if (db.captions.length > 50) {
      db.captions = db.captions.slice(0, 50);
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return newCaption;
  } catch (err) {
    console.error("Error saving caption to DB:", err);
    return null;
  }
}

// 1b. Get Generated Captions History
app.get("/api/legendas", (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.json({ captions: [] });
    }
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    return res.json({ captions: db.captions || [] });
  } catch (err) {
    console.error("Error loading captions history:", err);
    return res.status(500).json({ error: "Erro ao carregar histórico de legendas." });
  }
});

// 1c. Delete Caption from History
app.delete("/api/legendas/:id", (req, res) => {
  const id = req.params.id;
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "Banco de dados não encontrado." });
    }
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    if (!db.captions) {
      db.captions = [];
    }
    const index = db.captions.findIndex((c: any) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Legenda não encontrada no histórico." });
    }
    db.captions.splice(index, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return res.json({ success: true, message: "Legenda removida com sucesso." });
  } catch (err) {
    console.error("Error deleting caption:", err);
    return res.status(500).json({ error: "Erro ao excluir legenda do histórico." });
  }
});

// Helper to check admin auth header
function getIsAdmin(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  return authHeader === "Bearer admin-session-token-mrx-pg";
}

// 2. Get Profile Pictures (Biblioteca de Icons)
app.get("/api/images", (req, res) => {
  try {
    const isAdmin = getIsAdmin(req);
    if (!fs.existsSync(dbPath)) {
      return res.json({ images: [] });
    }
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const imagesList = db.images || [];
    
    if (isAdmin) {
      return res.json({ images: imagesList });
    } else {
      // Filter out only public ones for regular clients
      const publicImages = imagesList.filter((img: any) => img.isPublic !== false);
      return res.json({ images: publicImages });
    }
  } catch (err: any) {
    console.error("Error fetching images:", err);
    return res.status(500).json({ error: "Erro ao obter imagens do servidor." });
  }
});

// 3. Admin Login API
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "mrx.pg" && password === "1234Gag.") {
    return res.json({ 
      success: true, 
      token: "admin-session-token-mrx-pg",
      user: { username: "mrx.pg", role: "admin" } 
    });
  } else {
    return res.status(401).json({ error: "Credenciais inválidas. Tente novamente." });
  }
});

// 4. Admin Upload Image
app.post("/api/admin/images", (req, res) => {
  if (!getIsAdmin(req)) {
    return res.status(403).json({ error: "Acesso restrito para administradores." });
  }

  const { title, category, fileData, fileName, isPublic } = req.body;

  if (!fileData || !title || !category) {
    return res.status(400).json({ error: "Dados incompletos para upload (título, categoria e imagem base64 são necessários)." });
  }

  try {
    // Save Base64 image to files
    // Extract base64 content
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    const extension = fileName ? path.extname(fileName) : ".jpg";
    const uniqueFilename = `upload_${Date.now()}${extension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    // Add metadata to database
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const newImage = {
      id: String(Date.now()),
      filename: uniqueFilename,
      title: title,
      category: category,
      isPublic: isPublic !== undefined ? isPublic : true,
      createdAt: new Date().toISOString()
    };

    db.images.unshift(newImage);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.json({ success: true, image: newImage });
  } catch (err: any) {
    console.error("Error uploading image:", err);
    return res.status(500).json({ error: "Erro interno ao processar o upload.", details: err.message });
  }
});

// 5. Admin Delete Image
app.delete("/api/admin/images/:id", (req, res) => {
  if (!getIsAdmin(req)) {
    return res.status(403).json({ error: "Acesso restrito para administradores." });
  }

  const id = req.params.id;

  try {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const index = db.images.findIndex((img: any) => img.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    const imgToDelete = db.images[index];
    const filePath = path.join(uploadsDir, imgToDelete.filename);

    // Delete file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from db array
    db.images.splice(index, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.json({ success: true, message: "Imagem excluída com sucesso." });
  } catch (err: any) {
    console.error("Error deleting image:", err);
    return res.status(500).json({ error: "Erro ao excluir imagem.", details: err.message });
  }
});

// 6. Admin Toggle Image Public Status or Update Image
app.put("/api/admin/images/:id/toggle", (req, res) => {
  if (!getIsAdmin(req)) {
    return res.status(403).json({ error: "Acesso restrito para administradores." });
  }

  const id = req.params.id;

  try {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const img = db.images.find((img: any) => img.id === id);

    if (!img) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    // Toggle public status
    img.isPublic = !img.isPublic;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.json({ success: true, image: img });
  } catch (err: any) {
    console.error("Error toggling image status:", err);
    return res.status(500).json({ error: "Erro ao atualizar status da imagem.", details: err.message });
  }
});

// ----------------------------------------------------
// VITE AND STATIC PRODUCTION SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving built static files from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access development server at http://localhost:${PORT}`);
  });
}

startServer();
