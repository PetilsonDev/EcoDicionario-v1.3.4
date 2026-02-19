
import { DictionaryTerm, BotKnowledgeItem } from '../types';

// --- VERSÃO DO SISTEMA ---
// Sempre que adicionar novos termos, incremente esta versão (ex: 1.0.1)
// e atualize também o ficheiro metadata.json
export const APP_VERSION = "1.3.3";

// --- FUNÇÃO DE MERGE INCREMENTAL ---
export const mergeTerms = (localTerms: DictionaryTerm[], newTerms: DictionaryTerm[]): DictionaryTerm[] => {
  // Cria um mapa base com os termos locais indexados pelo Título (t)
  const termMap = new Map(localTerms.map(item => [item.t, item]));

  // Processa as alterações vindas do servidor
  newTerms.forEach(item => {
    // Se tiver deleted_at, removemos do mapa local
    if (item.deleted_at) {
      termMap.delete(item.t);
    } else {
      // Caso contrário, adicionamos ou atualizamos
      termMap.set(item.t, item);
    }
  });

  // Retorna o array ordenado alfabeticamente
  return Array.from(termMap.values()).sort((a, b) => a.t.localeCompare(b.t));
};

// --- FUNÇÃO DE SEGURANÇA (VALIDAÇÃO & SANITIZAÇÃO) ---
export const validateAndSanitizeTerms = (data: any): DictionaryTerm[] => {
  if (!Array.isArray(data)) {
    throw new Error("Formato inválido: Os dados devem ser uma lista.");
  }

  const MAX_TITLE_LENGTH = 100;
  const MAX_DESC_LENGTH = 2000; // Limite razoável para definição
  const sanitizedTerms: DictionaryTerm[] = [];

  // Função robusta para remover HTML e prevenir XSS usando o parser do navegador
  const stripHTML = (str: string) => {
    if (!str) return "";
    try {
        const doc = new DOMParser().parseFromString(str, 'text/html');
        return doc.body.textContent || "";
    } catch (e) {
        // Fallback simples caso DOMParser falhe (ex: ambientes sem window)
        return str.replace(/<[^>]*>?/gm, '');
    }
  };

  for (const item of data) {
    // 1. Verificar estrutura mínima (item deve ser objeto e ter título 't')
    if (!item || typeof item !== 'object' || !item.t) {
      continue; 
    }

    // 2. Garantir que são strings
    let t = String(item.t);
    // Se for uma deleção, 'd' pode vir vazio, então tratamos com fallback
    let d = item.d ? String(item.d) : "";
    let c = item.c ? String(item.c) : "Geral"; 
    
    // Captura o deleted_at se existir
    const deleted_at = item.deleted_at ? String(item.deleted_at) : null;

    // 3. Sanitizar (Remover HTML malicioso)
    t = stripHTML(t);
    d = stripHTML(d);
    c = stripHTML(c);

    // 4. Truncar textos excessivamente longos
    if (t.length > MAX_TITLE_LENGTH) t = t.substring(0, MAX_TITLE_LENGTH);
    if (d.length > MAX_DESC_LENGTH) d = d.substring(0, MAX_DESC_LENGTH) + "...";
    if (c.length > 30) c = c.substring(0, 30);

    const termObj: DictionaryTerm = { t, d, c };
    if (deleted_at) {
        termObj.deleted_at = deleted_at;
    }

    sanitizedTerms.push(termObj);
  }

  return sanitizedTerms;
};

// --- DICTIONARY DATA ---
export const ecoTerms: DictionaryTerm[] = [
  // ===================== ANGOLA (Geografia, Instituições, Biodiversidade Específica) =====================
  { c: "Angola", t: "ACADIR", d: "Associação de Conservação do Ambiente e Desenvolvimento Integrado Rural, ONG angolana de conservação." },
  { c: "Angola", t: "Agência Nacional de Resíduos", d: "Entidade responsável pela regulação e gestão estratégica dos resíduos em Angola." },
  { c: "Angola", t: "Baía dos Tigres", d: "A maior ilha de Angola, situada no deserto do Namibe, reserva natural importante, mas ameaçada." },
  { c: "Angola", t: "Cataratas de Kalandula", d: "Umas das maiores quedas de água de África, localizadas no rio Lucala, província de Malanje." },
  { c: "Angola", t: "Chana", d: "Planície vasta e aberta, típica do leste de Angola (Moxico e Cuando Cubango), caracterizada por solos arenosos e vegetação rasteira que alaga sazonalmente." },
  { c: "Angola", t: "Deserto do Namibe", d: "Um dos desertos mais antigos do mundo, estendendo-se pelo litoral sul de Angola, lar da Welwitschia." },
  { c: "Angola", t: "Fenda da Tundavala", d: "Formação geológica espetacular na Serra da Leba, Huíla, com vista panorâmica sobre o deserto." },
  { c: "Angola", t: "Ginguba (Amendoim)", d: "Leguminosa (Arachis hypogaea) amplamente cultivada em Angola; essencial para a dieta local e para o solo, pois as suas raízes fixam nitrogénio, melhorando a fertilidade." },
  { c: "Angola", t: "Ginguenga", d: "Pequeno fruto silvestre avermelhado e de sabor ácido, muito apreciado em várias regiões de Angola." },
  { c: "Angola", t: "Ilha do Mussulo", d: "Cordão litoral (restinga) ao sul de Luanda; um ecossistema frágil sob forte pressão turística e imobiliária." },
  { c: "Angola", t: "Imbondeiro (Baobá)", d: "Árvore monumental de tronco largo, símbolo da resistência da natureza em Angola." },
  { c: "Angola", t: "INBC", d: "Instituto Nacional da Biodiversidade e Conservação, responsável pelas áreas protegidas em Angola." },
  { c: "Angola", t: "Loengos", d: "Frutos pequenos e escuros, comuns no sul de Angola, frequentemente usados para fazer sumos e bebidas espirituosas." },
  { c: "Angola", t: "Maboque", d: "Fruto de casca dura e polpa amarela com sabor agridoce, nativo das savanas angolanas (Strychnos spinosa)." },
  { c: "Angola", t: "Maiombe", d: "Vasta floresta tropical em Cabinda, rica em biodiversidade e 'pulmão verde' de Angola." },
  { c: "Angola", t: "Manatim Africano", d: "Mamífero marinho herbívoro, conhecido como peixe-boi, que habita estuários e zonas costeiras de Angola, atualmente ameaçado." },
  { c: "Angola", t: "Mangais", d: "Ecossistemas costeiros vitais para a proteção da costa angolana e berçário de vida marinha." },
  { c: "Angola", t: "Mateba", d: "Palmeira nativa de onde se extrai a seiva para produzir o maruvo (bebida tradicional) e fibras para artesanato." },
  { c: "Angola", t: "Ministério do Ambiente", d: "Órgão do governo angolano responsável por conceber e executar a política ambiental." },
  { c: "Angola", t: "Miradouro da Lua", d: "Conjunto de falésias tricolores erodidas a sul de Luanda, um exemplo impressionante da força da erosão pluvial." },
  { c: "Angola", t: "Morro do Moco", d: "O ponto mais alto de Angola (2.620m), no Huambo, e uma área crítica para a conservação de aves endémicas e floresta afromontana." },
  { c: "Angola", t: "Múcua", d: "Fruto do imbondeiro, rico em vitaminas, minerais e antioxidantes." },
  { c: "Angola", t: "Mulemba", d: "Árvore sagrada e emblemática em Angola (Ficus), conhecida pela sua sombra vasta onde tradicionalmente se reúnem os sobas e a comunidade para resolver litígios." },
  { c: "Angola", t: "Okavango-Zambeze (KAZA)", d: "Maior área de conservação transfronteiriça do mundo, abrangendo Angola e países vizinhos." },
  { c: "Angola", t: "Palanca Negra Gigante", d: "Antílope endêmico de Angola (Malanje), símbolo nacional em perigo crítico de extinção." },
  { c: "Angola", t: "Parque Nacional da Cangandala", d: "O menor parque nacional de Angola, situado no Namibe, criado especificamente para proteger a Palanca Negra Gigante." },
  { c: "Angola", t: "Parque Nacional da Kissama", d: "Parque próximo a Luanda, conhecido pela fauna de savana e esforços de repovoamento." },
  { c: "Angola", t: "Parque Nacional da Mupa", d: "Localizado na província do Cunene, famoso historicamente pela sua população de girafas." },
  { c: "Angola", t: "Parque Nacional de Luengue-Luiana", d: "Situado no Cuando Cubango, é parte vital da área de conservação transfronteiriça KAZA, habitat de grandes manadas de elefantes." },
  { c: "Angola", t: "Parque Nacional de Mavinga", d: "Área de conservação no Cuando Cubango, contígua ao Luengue-Luiana, rica em vida selvagem de savana." },
  { c: "Angola", t: "Parque Nacional do Bicuar", d: "Parque na província da Huíla, em recuperação pós-conflito, habitat de elefantes, leões e antílopes." },
  { c: "Angola", t: "Parque Nacional do Iona", d: "Maior parque nacional de Angola, situado no Namibe, cobrindo deserto e semideserto." },
  { c: "Angola", t: "Pau-Rosa", d: "Árvore de madeira preciosa, alvo de exploração excessiva e tráfico, protegida por lei." },
  { c: "Angola", t: "Reserva Natural Integral do Luando", d: "Vasta área de proteção em Malanje, habitat primordial da Palanca Negra Gigante." },
  { c: "Angola", t: "Rio Cunene", d: "Rio importante no sul de Angola que forma a fronteira natural com a Namíbia e abriga as Quedas do Ruacaná e Epupa." },
  { c: "Angola", t: "Rio Kwanza", d: "Principal rio inteiramente angolano, vital para a hidroeletricidade e biodiversidade." },
  { c: "Angola", t: "Safú", d: "Fruto típico (Dacryodes edulis), de cor violeta a azulada, rico em gorduras saudáveis, geralmente consumido cozido ou assado." },
  { c: "Angola", t: "Serra da Leba", d: "Cadeia montanhosa na Huíla, famosa pela estrada sinuosa e biodiversidade única." },
  { c: "Angola", t: "Tacula", d: "Árvore de madeira vermelha (Pterocarpus tinctorius); a sua serradura é usada tradicionalmente como cosmético natural (munganda) e para rituais." },
  { c: "Angola", t: "Tartaruga-de-Couro", d: "A maior espécie de tartaruga marinha, que utiliza as praias angolanas para desova, necessitando de proteção rigorosa." },
  { c: "Angola", t: "Welwitschia mirabilis", d: "Planta endêmica do deserto do Namibe, conhecida pela sua longevidade milenar." },

  // ===================== LEIS E NORMAS (Legislação Angolana, Protocolos e ISO) =====================
  { c: "Leis e Normas", t: "Agenda 2030", d: "Plano global da ONU com 17 Objetivos de Desenvolvimento Sustentável (ODS)." },
  { c: "Leis e Normas", t: "APP (Área de Preservação Permanente)", d: "Áreas com vegetação nativa protegidas por lei (ex: margens de rios, topos de morros) para preservar recursos hídricos e estabilidade geológica." },
  { c: "Leis e Normas", t: "Biopirataria", d: "Exploração ilegal e não autorizada de recursos biológicos e conhecimentos tradicionais." },
  { c: "Leis e Normas", t: "CITES", d: "Convenção internacional que regula o comércio de espécies selvagens ameaçadas." },
  { c: "Leis e Normas", t: "Código Florestal", d: "Legislação que regulamenta a proteção da vegetação nativa e o uso da terra." },
  { c: "Leis e Normas", t: "Compensação Ambiental", d: "Mecanismo financeiro ou material para contrabalançar impactos ambientais não mitigáveis." },
  { c: "Leis e Normas", t: "Compliance Ambiental", d: "Estado de estar em conformidade com todas as leis, regulamentos, normas e requisitos ambientais aplicáveis." },
  { c: "Leis e Normas", t: "Conselhos de Meio Ambiente", d: "Órgãos colegiados com participação do governo e sociedade para debater e deliberar sobre questões ambientais." },
  { c: "Leis e Normas", t: "Constituição da República de Angola (Art. 39)", d: "Estabelece o direito de todos a viver num ambiente sadio e o dever de o defender." },
  { c: "Leis e Normas", t: "Convenção de Ramsar", d: "Tratado internacional para a conservação e uso sustentável de zonas húmidas." },
  { c: "Leis e Normas", t: "Defeso", d: "Período durante o qual é proibida a caça ou pesca de determinadas espécies para garantir a sua reprodução." },
  { c: "Leis e Normas", t: "Estratégia Nacional de Alterações Climáticas", d: "Documento orientador do governo angolano para mitigação e adaptação climática." },
  { c: "Leis e Normas", t: "ISO (International Organization for Standardization)", d: "Organização internacional não governamental independente, com sede em Genebra, que desenvolve normas voluntárias para garantir qualidade, segurança e eficiência." },
  { c: "Leis e Normas", t: "ISO 9000", d: "Família de normas que define os fundamentos e vocabulário para Sistemas de Gestão da Qualidade (SGQ)." },
  { c: "Leis e Normas", t: "ISO 9001", d: "Norma que estabelece os requisitos para um Sistema de Gestão da Qualidade, focada na satisfação do cliente e melhoria contínua dos processos." },
  { c: "Leis e Normas", t: "ISO 14000", d: "Série de normas internacionais relacionadas à gestão ambiental, auxiliando as organizações a minimizar os efeitos negativos das suas operações no ambiente." },
  { c: "Leis e Normas", t: "ISO 14001", d: "Norma principal da série 14000, especifica os requisitos para um Sistema de Gestão Ambiental (SGA), permitindo que uma organização desenvolva e implemente uma política e objetivos ambientais." },
  { c: "Leis e Normas", t: "ISO 14004", d: "Norma que fornece diretrizes gerais sobre princípios, sistemas e técnicas de apoio para a implementação de sistemas de gestão ambiental." },
  { c: "Leis e Normas", t: "ISO 14006", d: "Diretrizes para incorporar o Eco-design (design ecológico) no desenvolvimento de produtos e no sistema de gestão ambiental." },
  { c: "Leis e Normas", t: "ISO 14040", d: "Norma sobre Avaliação do Ciclo de Vida (ACV) - Princípios e estrutura para analisar o impacto ambiental de um produto do 'berço ao túmulo'." },
  { c: "Leis e Normas", t: "ISO 14064", d: "Norma focada na quantificação, monitoramento e relatórios de emissões e remoções de Gases de Efeito Estufa (GEE)." },
  { c: "Leis e Normas", t: "ISO 19011", d: "Diretrizes para auditoria de sistemas de gestão. É a 'bíblia' para auditores internos e externos de ISO 9001, 14001, 45001, entre outras." },
  { c: "Leis e Normas", t: "ISO 20400", d: "Diretrizes para Compras Sustentáveis, auxiliando organizações a integrar a sustentabilidade nos seus processos de aquisição." },
  { c: "Leis e Normas", t: "ISO 22000", d: "Norma para Sistemas de Gestão da Segurança de Alimentos, garantindo a segurança em toda a cadeia de fornecimento alimentar." },
  { c: "Leis e Normas", t: "ISO 26000", d: "Norma de diretrizes sobre Responsabilidade Social. Diferente das outras, não é certificável, servindo apenas como guia para atuação ética e transparente." },
  { c: "Leis e Normas", t: "ISO 31000", d: "Norma que fornece diretrizes e princípios para a Gestão de Riscos, aplicável a qualquer tipo de risco e organização." },
  { c: "Leis e Normas", t: "ISO 45001", d: "Norma para Sistemas de Gestão de Saúde e Segurança Ocupacional. Substituiu a OHSAS 18001, focando na prevenção pró-ativa de lesões e doenças no trabalho." },
  { c: "Leis e Normas", t: "ISO 50001", d: "Norma para Sistemas de Gestão de Energia, cujo objetivo é habilitar as organizações a estabelecer sistemas e processos para melhorar o desempenho energético." },
  { c: "Leis e Normas", t: "Lei das Águas (Angola)", d: "Lei n.º 6/02, que regula a gestão, utilização e proteção dos recursos hídricos nacionais." },
  { c: "Leis e Normas", t: "Lei de Bases do Ambiente", d: "Lei n.º 5/98, diploma fundamental que define os princípios da proteção ambiental em Angola." },
  { c: "Leis e Normas", t: "Licença Ambiental", d: "Ato administrativo que autoriza a localização e operação de empreendimentos." },
  { c: "Leis e Normas", t: "Licenciamento Ambiental", d: "Procedimento administrativo pelo qual o órgão ambiental autoriza a localização, instalação, ampliação e operação de empreendimentos." },
  { c: "Leis e Normas", t: "ODS (Objetivos de Desenvolvimento Sustentável)", d: "Metas globais da ONU para erradicar a pobreza e proteger o planeta." },
  { c: "Leis e Normas", t: "Paisagem Protegida", d: "Área onde a interação humana e natureza criou características distintas." },
  { c: "Leis e Normas", t: "Passivo Ambiental", d: "Danos ambientais antigos que uma empresa tem obrigação de reparar." },
  { c: "Leis e Normas", t: "Plano Nacional de Gestão Ambiental", d: "Instrumento estratégico para a implementação da política ambiental em Angola." },
  { c: "Leis e Normas", t: "Poluidor-Pagador", d: "Princípio onde quem causa poluição deve arcar com os custos de a gerir ou limpar." },
  { c: "Leis e Normas", t: "Precaução (Princípio)", d: "Agir para prevenir danos graves mesmo sem certeza científica absoluta." },
  { c: "Leis e Normas", t: "Protocolo de Montreal", d: "Tratado internacional para eliminar substâncias que destroem a camada de ozono." },
  { c: "Leis e Normas", t: "Protocolo de Quioto", d: "Tratado internacional pioneiro para redução de gases de efeito estufa." },
  { c: "Leis e Normas", t: "Reserva Legal", d: "Percentual de uma propriedade rural que deve ser mantido com vegetação nativa." },
  { c: "Leis e Normas", t: "Termo de Ajustamento de Conduta (TAC)", d: "Acordo extrajudicial celebrado entre o Ministério Público e o poluidor para corrigir danos ou adequar condutas ambientais." },
  { c: "Leis e Normas", t: "Unidade de Conservação (UC)", d: "Espaço territorial com características naturais relevantes, protegido por lei." },
  { c: "Leis e Normas", t: "Zona de Amortecimento", d: "Área ao redor de uma unidade de conservação onde atividades são restritas." },
  { c: "Leis e Normas", t: "Zona Económica Exclusiva (ZEE)", d: "Faixa oceânica onde um Estado tem direitos especiais de exploração." },
  { c: "Leis e Normas", t: "Zoneamento Ambiental", d: "Divisão do território em zonas com diferentes regras de uso e proteção." },

  // ===================== ECOLOGIA (Conceitos Naturais e Ecossistemas) =====================
  { c: "Ecologia", t: "Abiótico", d: "Fatores físicos e químicos não vivos de um ecossistema (luz, água, temperatura)." },
  { c: "Ecologia", t: "Aeróbio", d: "Processo ou organismo que requer a presença de oxigénio para viver ou ocorrer." },
  { c: "Ecologia", t: "Aflorestamento", d: "Plantio de árvores em áreas que historicamente não eram florestas." },
  { c: "Ecologia", t: "Agrobiodiversidade", d: "Espécies e variedades agrícolas cultivadas pela humanidade há milénios, essenciais para a segurança alimentar." },
  { c: "Ecologia", t: "Alelopatia", d: "Inibição do crescimento de uma planta por substâncias químicas libertadas por outra." },
  { c: "Ecologia", t: "Anaeróbio", d: "Processo ou organismo que vive ou ocorre na ausência de oxigénio." },
  { c: "Ecologia", t: "Aquífero", d: "Formação geológica subterrânea capaz de armazenar e transmitir água." },
  { c: "Ecologia", t: "Bacia Hidrográfica", d: "Área de drenagem de um rio principal e seus afluentes." },
  { c: "Ecologia", t: "Bentos", d: "Organismos que vivem no fundo de ambientes aquáticos (ex: estrelas-do-mar, caranguejos)." },
  { c: "Ecologia", t: "Bioacumulação", d: "Absorção e retenção de substâncias químicas num organismo ao longo da vida." },
  { c: "Ecologia", t: "Biocapacidade", d: "Capacidade de um ecossistema de produzir recursos biológicos úteis e absorver resíduos." },
  { c: "Ecologia", t: "Biocenose", d: "Comunidade de seres vivos que habitam um determinado local (Biótopo)." },
  { c: "Ecologia", t: "Biofilme", d: "Camada de microrganismos que adere a uma superfície." },
  { c: "Ecologia", t: "Bioindicador", d: "Espécie ou comunidade biológica usada para avaliar a qualidade do ambiente." },
  { c: "Ecologia", t: "Bioluminescência", d: "Emissão de luz por organismos vivos (ex: pirilampos, algas)." },
  { c: "Ecologia", t: "Biomagnificação", d: "Aumento da concentração de poluentes nos níveis superiores da cadeia alimentar." },
  { c: "Ecologia", t: "Bioma", d: "Grande comunidade ecológica regional definida por clima e vegetação (ex: Savana)." },
  { c: "Ecologia", t: "Biosfera", d: "Conjunto de todas as regiões da Terra onde existe vida." },
  { c: "Ecologia", t: "Biótopo", d: "Espaço físico com condições ambientais uniformes onde vive uma biocenose." },
  { c: "Ecologia", t: "Cadeia Alimentar", d: "Sequência linear de transferência de energia e nutrientes entre organismos." },
  { c: "Ecologia", t: "Capacidade de Carga", d: "População máxima que um ambiente pode sustentar indefinidamente." },
  { c: "Ecologia", t: "Ciclagem de Nutrientes", d: "Movimento e troca de matéria orgânica e inorgânica para produção de vida." },
  { c: "Ecologia", t: "Ciclo Biogeoquímico", d: "Circulação de elementos químicos entre os seres vivos e o ambiente físico." },
  { c: "Ecologia", t: "Comensalismo", d: "Relação ecológica onde uma espécie beneficia e a outra não é afetada." },
  { c: "Ecologia", t: "Competição", d: "Interação onde organismos disputam recursos limitados (água, luz, alimento)." },
  { c: "Ecologia", t: "Conectividade", d: "Grau de ligação entre habitats que permite o movimento de espécies." },
  { c: "Ecologia", t: "Controle Biológico", d: "Combate a pragas agrícolas utilizando seus inimigos naturais (insetos, fungos) em vez de agrotóxicos." },
  { c: "Ecologia", t: "Corredor Ecológico", d: "Faixa de vegetação que liga fragmentos florestais isolados." },
  { c: "Ecologia", t: "Decompositores", d: "Organismos (fungos e bactérias) que reciclam nutrientes de matéria morta." },
  { c: "Ecologia", t: "Detritívoro", d: "Organismo que se alimenta de restos orgânicos (detritos)." },
  { c: "Ecologia", t: "Dispersão de Sementes", d: "Transporte de sementes para longe da planta mãe (por vento, água ou animais)." },
  { c: "Ecologia", t: "Ecologia", d: "Ciência que estuda as relações dos seres vivos entre si e com o meio ambiente." },
  { c: "Ecologia", t: "Ecossistema", d: "Comunidade de organismos interagindo com seu ambiente físico como um sistema." },
  { c: "Ecologia", t: "Endemismo", d: "Estado de uma espécie ser exclusiva de uma determinada região geográfica." },
  { c: "Ecologia", t: "Epífita", d: "Planta que cresce sobre outra usando-a apenas como suporte, sem parasitá-la (ex: orquídeas)." },
  { c: "Ecologia", t: "Espécie Chave", d: "Espécie com efeito desproporcionalmente grande no seu ambiente." },
  { c: "Ecologia", t: "Espécie Exótica", d: "Espécie que se encontra fora da sua área de distribuição natural." },
  { c: "Ecologia", t: "Espécie Invasora", d: "Espécie exótica que se prolifera e ameaça a biodiversidade nativa." },
  { c: "Ecologia", t: "Estuário", d: "Corpo de água costeiro onde a água doce do rio se mistura com a água salgada do mar." },
  { c: "Ecologia", t: "Eutrofização", d: "Enriquecimento excessivo da água com nutrientes, causando explosão de algas e morte de peixes." },
  { c: "Ecologia", t: "Evapotranspiração", d: "Perda de água do solo por evaporação e das plantas por transpiração." },
  { c: "Ecologia", t: "Extinção", d: "Desaparecimento completo de uma espécie." },
  { c: "Ecologia", t: "Fator Limitante", d: "Recurso ambiental cuja escassez limita o crescimento de uma população." },
  { c: "Ecologia", t: "Fauna Bêntica", d: "Animais que vivem no substrato do fundo de ambientes aquáticos." },
  { c: "Ecologia", t: "Floresta de Galeria", d: "Vegetação florestal que acompanha as margens de rios em regiões de savana." },
  { c: "Ecologia", t: "Fotossíntese", d: "Processo em que plantas e algas usam luz solar para criar alimento." },
  { c: "Ecologia", t: "Fragmentação de Habitat", d: "Processo onde um habitat contínuo é dividido em manchas isoladas." },
  { c: "Ecologia", t: "Fragmentos Florestais", d: "Pequenas áreas de floresta que restaram após o desmatamento ao redor, isolando espécies." },
  { c: "Ecologia", t: "Habitat", d: "Local ou ambiente natural onde um organismo vive." },
  { c: "Ecologia", t: "Hotspot de Biodiversidade", d: "Região com enorme biodiversidade mas sob ameaça extrema de destruição." },
  { c: "Ecologia", t: "Húmus", d: "Matéria orgânica decomposta no solo, essencial para a fertilidade." },
  { c: "Ecologia", t: "Macroinvertebrados", d: "Pequenos animais aquáticos visíveis a olho nu, usados como bioindicadores." },
  { c: "Ecologia", t: "Mata Ciliar", d: "Vegetação que protege as margens de rios e lagos (cílios do rio)." },
  { c: "Ecologia", t: "Microclima", d: "Clima de uma área pequena e restrita, diferindo da zona envolvente." },
  { c: "Ecologia", t: "Nicho Ecológico", d: "O papel e posição de uma espécie no seu ambiente (o que come, onde vive)." },
  { c: "Ecologia", t: "Nitrificação", d: "Processo biológico de conversão de amónia em nitrato no solo." },
  { c: "Ecologia", t: "Nível Trófico", d: "Posição que um organismo ocupa na cadeia alimentar (produtor, consumidor)." },
  { c: "Ecologia", t: "Nutrientes", d: "Substâncias químicas essenciais para a vida (Nitrogénio, Fósforo, Potássio)." },
  { c: "Ecologia", t: "Pirâmide Ecológica", d: "Representação gráfica da biomassa ou energia em cada nível trófico." },
  { c: "Ecologia", t: "Plâncton", d: "Organismos microscópicos que derivam nas águas (base da cadeia alimentar aquática)." },
  { c: "Ecologia", t: "Polinizador", d: "Animal que transporta pólen, essencial para a reprodução de muitas plantas." },
  { c: "Ecologia", t: "Predador de Topo", d: "Animal que está no topo da cadeia alimentar e não tem predadores naturais." },
  { c: "Ecologia", t: "Produtividade Primária", d: "Taxa na qual a energia solar é convertida em matéria orgânica pelos produtores." },
  { c: "Ecologia", t: "Recifes de Coral", d: "Estruturas submarinas de biodiversidade imensa, formadas por corais." },
  { c: "Ecologia", t: "Rede Trófica", d: "Conjunto complexo de cadeias alimentares interligadas num ecossistema." },
  { c: "Ecologia", t: "Regeneração Natural", d: "Recuperação espontânea da vegetação nativa sem intervenção humana." },
  { c: "Ecologia", t: "Resiliência Ecológica", d: "Capacidade de um ecossistema de absorver choques e manter as suas funções." },
  { c: "Ecologia", t: "Respiração Celular", d: "Processo pelo qual as células obtêm energia a partir de nutrientes." },
  { c: "Ecologia", t: "Restinga", d: "Ecossistema costeiro de dunas e vegetação adaptada à salinidade." },
  { c: "Ecologia", t: "Saprófita", d: "Organismo que se alimenta de matéria orgânica em decomposição." },
  { c: "Ecologia", t: "Savana", d: "Bioma caracterizado por vegetação rasteira e árvores esparsas, predominante em Angola." },
  { c: "Ecologia", t: "Seleção Natural", d: "Processo evolutivo onde os mais adaptados sobrevivem." },
  { c: "Ecologia", t: "Serapilheira", d: "Camada de folhas e material orgânico sobre o solo da floresta." },
  { c: "Ecologia", t: "Serviços Ecossistémicos", d: "Benefícios que a natureza fornece aos humanos (água, ar puro, polinização)." },
  { c: "Ecologia", t: "Simbiose", d: "Interação próxima e prolongada entre organismos de espécies diferentes." },
  { c: "Ecologia", t: "Sucessão Ecológica", d: "Processo gradual de mudança na composição das espécies de um ecossistema." },
  { c: "Ecologia", t: "Taxonomia", d: "Ciência de classificação dos seres vivos." },
  { c: "Ecologia", t: "Teia Alimentar", d: "Conjunto complexo de cadeias alimentares interligadas." },
  { c: "Ecologia", t: "Transpiração", d: "Perda de água na forma de vapor pelas plantas." },
  { c: "Ecologia", t: "Vetor", d: "Organismo que transmite doenças (ex: mosquito)." },
  { c: "Ecologia", t: "Zona Costeira", d: "Área de transição e interação entre o ambiente terrestre e marinho." },
  { c: "Ecologia", t: "Zona Húmida (Wetland)", d: "Área onde a água é o principal fator controlador (pântanos, mangais)." },
  { c: "Ecologia", t: "Zona Ripária", d: "Área de terra adjacente a um curso de água, vital para a ecologia do rio." },
  { c: "Ecologia", t: "Zooplâncton", d: "Pequenos animais que vivem em suspensão na água e alimentam-se de fitoplâncton." },

  // ===================== MUDANÇAS CLIMÁTICAS =====================
  { c: "Mudanças climáticas", t: "Acidificação Oceânica", d: "Diminuição do pH dos oceanos devido à absorção excessiva de CO2 da atmosfera." },
  { c: "Mudanças climáticas", t: "Adaptação Climática", d: "Ajuste dos sistemas naturais ou humanos em resposta a mudanças climáticas." },
  { c: "Mudanças climáticas", t: "Albedo", d: "Capacidade de reflexão da radiação solar de uma superfície (gelo tem alto albedo, asfalto baixo)." },
  { c: "Mudanças climáticas", t: "Branqueamento de Corais", d: "Perda de cor e vitalidade dos corais devido ao stress térmico e acidificação." },
  { c: "Mudanças climáticas", t: "Captura de Carbono (CCS)", d: "Tecnologia para capturar CO2 de grandes fontes e armazená-lo para não atingir a atmosfera." },
  { c: "Mudanças climáticas", t: "Carbono Azul", d: "Carbono capturado e armazenado pelos ecossistemas oceânicos e costeiros." },
  { c: "Mudanças climáticas", t: "Clorofluorcarbonetos (CFCs)", d: "Gases sintéticos que causam a destruição da camada de ozono." },
  { c: "Mudanças climáticas", t: "Combustíveis Fósseis", d: "Fontes de energia não renováveis formadas por decomposição milenar (petróleo, carvão)." },
  { c: "Mudanças climáticas", t: "Criosfera", d: "Partes da superfície da Terra onde a água se encontra em estado sólido (gelo)." },
  { c: "Mudanças climáticas", t: "Desertificação", d: "Degradação da terra em zonas áridas, semiáridas e subúmidas secas." },
  { c: "Mudanças climáticas", t: "Dióxido de Carbono (CO2)", d: "Principal gás de efeito estufa emitido por atividades humanas." },
  { c: "Mudanças climáticas", t: "Efeito Estufa", d: "Aquecimento natural da Terra, intensificado por emissões de gases poluentes." },
  { c: "Mudanças climáticas", t: "Enchentes", d: "Transbordamento de água de rios ou canais, frequentemente agravado pela impermeabilização urbana." },
  { c: "Mudanças climáticas", t: "Gases de Efeito Estufa (GEE)", d: "Gases (CO2, metano, etc.) que retêm calor na atmosfera." },
  { c: "Mudanças climáticas", t: "Ilha de Calor", d: "Fenómeno onde áreas urbanas são mais quentes que as zonas rurais circundantes." },
  { c: "Mudanças climáticas", t: "Mercado de Carbono", d: "Sistema de negociação de créditos de emissão de gases de efeito estufa para reduzir o aquecimento global." },
  { c: "Mudanças climáticas", t: "Metano (CH4)", d: "Gás de efeito estufa potente, libertado em aterros e pela pecuária." },
  { c: "Mudanças climáticas", t: "Neutralidade de Carbono", d: "Estado onde as emissões líquidas de carbono são iguais a zero." },
  { c: "Mudanças climáticas", t: "Paleoclima", d: "Estudo dos climas em épocas geológicas passadas." },
  { c: "Mudanças climáticas", t: "Pegada de Carbono", d: "Total de gases de efeito estufa emitidos direta ou indiretamente por alguém." },
  { c: "Mudanças climáticas", t: "Seca", d: "Período prolongado de deficiência de precipitação." },
  { c: "Mudanças climáticas", t: "Sequestro de Carbono", d: "Remoção e armazenamento de CO2 da atmosfera (ex: por florestas)." },
  { c: "Mudanças climáticas", t: "Transição Energética", d: "Mudança estrutural de combustíveis fósseis para fontes renováveis." },

  // ===================== GESTÃO (Corporativa, Resíduos e Processos) =====================
  { c: "Gestão", t: "Análise de Ciclo de Vida (ACV)", d: "Avaliação dos impactos ambientais de um produto desde a matéria-prima até ao descarte." },
  { c: "Gestão", t: "Análise de Risco Ambiental", d: "Processo estruturado para identificar, avaliar e controlar riscos de danos ao meio ambiente decorrentes de atividades industriais." },
  { c: "Gestão", t: "Áreas Contaminadas", d: "Locais onde há comprovação de poluição ou contaminação no solo ou água subterrânea, exigindo intervenção ou remediação." },
  { c: "Gestão", t: "Aterro Sanitário", d: "Local de disposição final de resíduos sólidos com engenharia para proteção ambiental." },
  { c: "Gestão", t: "Auditoria Ambiental", d: "Avaliação sistemática e documentada sobre o desempenho ambiental de uma organização." },
  { c: "Gestão", t: "Avaliação Ambiental Estratégica (AAE)", d: "Instrumento de planeamento que avalia os impactos ambientais de políticas, planos e programas governamentais antes da sua implementação." },
  { c: "Gestão", t: "Avaliação de Impacto Ambiental (AIA)", d: "Procedimento preventivo que analisa os efeitos ambientais de um projeto proposto, essencial para o licenciamento." },
  { c: "Gestão", t: "Balanço de Massa", d: "Ferramenta de gestão que contabiliza todas as entradas (matéria-prima, água, energia) e saídas (produtos, resíduos, emissões) de um processo." },
  { c: "Gestão", t: "Benchmarking Ambiental", d: "Processo de comparação do desempenho ambiental de uma empresa com as melhores práticas do setor ou concorrentes." },
  { c: "Gestão", t: "Certificação Ambiental", d: "Atestado emitido por organismo independente de que uma empresa, produto ou serviço cumpre determinados requisitos ambientais (ex: ISO 14001)." },
  { c: "Gestão", t: "Cinco Rs", d: "Política de gestão de resíduos: Repensar, Recusar, Reduzir, Reutilizar e Reciclar." },
  { c: "Gestão", t: "Coleta Seletiva", d: "Recolha diferenciada de resíduos (papel, plástico, vidro, metal) para encaminhamento à reciclagem." },
  { c: "Gestão", t: "Condicionante Ambiental", d: "Exigência técnica ou jurídica estabelecida pelo órgão ambiental dentro de uma licença, que a empresa deve cumprir." },
  { c: "Gestão", t: "Coprocessamento", d: "Utilização de resíduos como substitutos de combustível ou matéria-prima em fornos industriais (ex: cimenteiras), destruindo o resíduo de forma segura." },
  { c: "Gestão", t: "Due Diligence Ambiental", d: "Investigação e auditoria prévia dos passivos e riscos ambientais de uma empresa ou propriedade antes de uma fusão ou aquisição." },
  { c: "Gestão", t: "Eco-design", d: "Design de produtos que considera o impacto ambiental em todo o seu ciclo de vida." },
  { c: "Gestão", t: "Eco-eficiência", d: "Filosofia de gestão que incentiva a criar mais valor com menos impacto." },
  { c: "Gestão", t: "Ecolabel (Rótulo Ecológico)", d: "Selo que identifica produtos ou serviços que têm menor impacto ambiental comparados a outros da mesma categoria." },
  { c: "Gestão", t: "Economia Circular", d: "Sistema económico que visa eliminar resíduos e manter produtos em uso contínuo." },
  { c: "Gestão", t: "Economia Verde", d: "Economia que resulta em bem-estar humano e equidade social, reduzindo riscos ambientais." },
  { c: "Gestão", t: "Estudo de Impacto Ambiental (EIA)", d: "Documento técnico detalhado e multidisciplinar exigido para o licenciamento de empreendimentos com potencial de causar significativa degradação ambiental." },
  { c: "Gestão", t: "Gestão de Resíduos", d: "Conjunto de ações de recolha, transporte, tratamento e destino final do lixo." },
  { c: "Gestão", t: "Gestão Integrada de Resíduos", d: "Abordagem completa que envolve desde a não geração até a disposição final, priorizando a reutilização e reciclagem." },
  { c: "Gestão", t: "Greenwashing", d: "Prática de marketing enganosa que faz uma empresa parecer mais ecológica do que é." },
  { c: "Gestão", t: "Incineração", d: "Queima controlada de resíduos sólidos, podendo gerar energia." },
  { c: "Gestão", t: "Indicador Ambiental", d: "Parâmetro que fornece informações sobre o estado do meio ambiente." },
  { c: "Gestão", t: "Inventário de Emissões", d: "Levantamento quantitativo detalhado de todos os gases e poluentes emitidos por uma fonte ou região num determinado período." },
  { c: "Gestão", t: "Logística Reversa", d: "Retorno de produtos pós-consumo (ex: pilhas, pneus) ao fabricante para descarte correto ou reciclagem." },
  { c: "Gestão", t: "Logística Verde", d: "Otimização de transporte e armazenamento visando reduzir emissões de CO2, embalagens e desperdícios na cadeia de suprimentos." },
  { c: "Gestão", t: "Marketing Verde", d: "Estratégia de comunicação focada nos benefícios e atributos ambientais de produtos ou da marca, devendo evitar o greenwashing." },
  { c: "Gestão", t: "Metabolismo Urbano", d: "Modelo que analisa o fluxo de materiais, energia e água que entram numa cidade e os resíduos e emissões que saem." },
  { c: "Gestão", t: "Mitigação", d: "Medidas técnicas destinadas a prevenir, reduzir ou controlar impactos ambientais negativos de uma atividade." },
  { c: "Gestão", t: "Monitoramento Ambiental", d: "Acompanhamento sistemático e contínuo de parâmetros ambientais (qualidade do ar, água, ruído) para verificar conformidade." },
  { c: "Gestão", t: "Obsolescência Programada", d: "Estratégia de desenhar produtos para terem vida útil curta, gerando mais lixo." },
  { c: "Gestão", t: "Plano de Controle Ambiental (PCA)", d: "Documento técnico que detalha os projetos e programas executivos para minimizar impactos ambientais de uma obra ou atividade." },
  { c: "Gestão", t: "Plano de Gerenciamento de Resíduos (PGRS)", d: "Documento obrigatório que identifica os tipos de resíduos gerados e define o seu manejo ambientalmente adequado." },
  { c: "Gestão", t: "Plano de Recuperação de Áreas Degradadas (PRAD)", d: "Conjunto de medidas para propiciar a restauração ecológica de áreas alteradas (comum na mineração)." },
  { c: "Gestão", t: "Produção Mais Limpa (P+L)", d: "Aplicação contínua de uma estratégia ambiental preventiva aos processos, produtos e serviços para aumentar a eficiência e reduzir riscos." },
  { c: "Gestão", t: "Reciclagem", d: "Processo de transformação de resíduos em novos materiais." },
  { c: "Gestão", t: "Reciclagem Energética", d: "Recuperação de energia a partir da queima de resíduos." },
  { c: "Gestão", t: "Relatório de Impacto Ambiental (RIMA)", d: "Documento que traduz as conclusões do EIA em linguagem acessível, ilustrada e clara, destinado à comunicação com o público e tomadores de decisão." },
  { c: "Gestão", t: "Resíduos de Construção (RCD)", d: "Entulho gerado por obras de construção e demolição." },
  { c: "Gestão", t: "Resíduos Hospitalares", d: "Lixo proveniente de serviços de saúde, com risco de infeção." },
  { c: "Gestão", t: "Resíduos Perigosos", d: "Lixo com características de inflamabilidade, corrosividade, toxicidade ou patogenicidade." },
  { c: "Gestão", t: "Responsabilidade Estendida do Produtor", d: "Princípio onde o fabricante é responsável pelo ciclo de vida do produto, incluindo o seu recolhimento e descarte pós-consumo." },
  { c: "Gestão", t: "Reutilização", d: "Uso de um produto novamente para o mesmo fim sem processamento industrial." },
  { c: "Gestão", t: "Risco Ambiental", d: "Probabilidade de ocorrência de danos ao meio ambiente." },
  { c: "Gestão", t: "Sinalização Ambiental", d: "Placas e avisos que informam sobre aspectos ambientais ou orientam condutas." },
  { c: "Gestão", t: "Sistema de Gestão Integrada (SGI)", d: "Sistema que unifica a gestão de qualidade (ISO 9001), meio ambiente (ISO 14001) e saúde/segurança (ISO 45001)." },
  { c: "Gestão", t: "Stakeholders", d: "Partes interessadas (comunidade, governo, investidores, funcionários) que afetam ou são afetadas pelo desempenho ambiental da organização." },
  { c: "Gestão", t: "Tecnologia Limpa", d: "Processos industriais desenhados para reduzir o impacto ambiental." },
  { c: "Gestão", t: "Tripé da Sustentabilidade", d: "Conceito (Triple Bottom Line) que avalia o desempenho empresarial em três dimensões: Social, Ambiental e Econômica." },
  { c: "Gestão", t: "Valorização de Resíduos", d: "Qualquer operação que permita o reaproveitamento de resíduos." },
  { c: "Gestão", t: "Valorização Energética", d: "Processo de tratamento de resíduos que aproveita o seu potencial calorífico para gerar energia (Waste-to-Energy)." },
  { c: "Gestão", t: "Vida Útil de Aterro", d: "Tempo estimado que um aterro sanitário pode receber resíduos até encher." },
  { c: "Gestão", t: "Zoneamento Ecológico-Econômico (ZEE)", d: "Instrumento de organização do território que compatibiliza o desenvolvimento socioeconômico com a proteção ambiental." },

  // ===================== HIGIENE, SEGURANÇA E SAÚDE NO TRABALHO (HST) =====================
  { c: "HST", t: "Acidente de Trabalho", d: "Evento súbito ocorrido no exercício do trabalho que provoca lesão corporal, perturbação funcional, morte ou redução da capacidade laboral." },
  { c: "HST", t: "Análise Preliminar de Risco (APR)", d: "Técnica de avaliação prévia que consiste em identificar detalhadamente os riscos envolvidos em cada etapa de uma tarefa antes de sua execução." },
  { c: "HST", t: "Ato Inseguro", d: "Comportamento ou ação do trabalhador que, por imprudência, negligência ou imperícia, o expõe a riscos de acidente (termo clássico em segurança)." },
  { c: "HST", t: "Comissão de Segurança e Saúde (CSST)", d: "Grupo de trabalhadores designados para monitorizar e promover a segurança e saúde no ambiente de trabalho (similar à CIPA)." },
  { c: "HST", t: "Condição Insegura", d: "Falhas no ambiente de trabalho (equipamentos defeituosos, falta de proteção, iluminação inadequada) que comprometem a segurança." },
  { c: "HST", t: "DDS (Diálogo Diário de Segurança)", d: "Breve reunião diária, geralmente antes do início do turno, para discutir riscos e medidas de prevenção." },
  { c: "HST", t: "Doença Profissional", d: "Enfermidade produzida ou desencadeada pelo exercício do trabalho peculiar a determinada atividade (ex: silicose, LER/DORT)." },
  { c: "HST", t: "EPC (Equipamento de Proteção Coletiva)", d: "Dispositivos instalados no ambiente de trabalho para proteção de todos os trabalhadores (ex: corrimões, exaustores, biombos)." },
  { c: "HST", t: "EPI (Equipamento de Proteção Individual)", d: "Dispositivo de uso pessoal destinado a proteger a saúde e a integridade física do trabalhador (ex: capacete, luvas, botas)." },
  { c: "HST", t: "Ergonomia", d: "Ciência que estuda a adaptação do posto de trabalho ao homem, visando conforto, segurança e eficiência (postura, mobiliário, iluminação)." },
  { c: "HST", t: "Espaço Confinado", d: "Área não projetada para ocupação humana contínua, com meios limitados de entrada e saída e ventilação insuficiente (ex: tanques, silos)." },
  { c: "HST", t: "FDS (Ficha de Dados de Segurança)", d: "Documento que fornece informações detalhadas sobre os perigos, manuseio seguro e resposta a emergências de produtos químicos (antiga FISPQ)." },
  { c: "HST", t: "Higiene Ocupacional", d: "Ciência que antecipa, reconhece, avalia e controla os riscos ambientais (físicos, químicos e biológicos) que podem afetar a saúde do trabalhador." },
  { c: "HST", t: "Insalubridade", d: "Condições de trabalho que expõem o empregado a agentes nocivos à saúde acima dos limites de tolerância fixados pela norma." },
  { c: "HST", t: "Mapa de Riscos", d: "Representação gráfica sobre a planta baixa do local de trabalho, indicando os tipos de riscos através de círculos de diferentes cores e tamanhos." },
  { c: "HST", t: "Periculosidade", d: "Característica de atividades que implicam risco acentuado ao trabalhador em virtude de exposição permanente a inflamáveis, explosivos ou eletricidade." },
  { c: "HST", t: "Permissão de Trabalho (PT)", d: "Documento escrito que autoriza o início de determinadas atividades de risco (ex: trabalho em altura, a quente), garantindo que as precauções foram tomadas." },
  { c: "HST", t: "Plano de Emergência", d: "Conjunto de procedimentos e ações a serem adotadas em caso de sinistro (incêndio, vazamento) para proteger vidas e património." },
  { c: "HST", t: "Primeiros Socorros", d: "Cuidados imediatos prestados a uma pessoa ferida ou doente até a chegada de assistência médica profissional." },
  { c: "HST", t: "Risco Biológico", d: "Probabilidade de exposição a microrganismos (vírus, bactérias, fungos) que podem causar doenças." },
  { c: "HST", t: "Risco Ergonómico", d: "Fatores que podem interferir nas características psicofisiológicas do trabalhador, causando desconforto ou doença (ex: esforço repetitivo, levantamento de peso)." },
  { c: "HST", t: "Risco Físico", d: "Formas de energia a que os trabalhadores podem estar expostos, como ruído, vibrações, pressões anormais, temperaturas extremas e radiações." },
  { c: "HST", t: "Risco Químico", d: "Perigo decorrente da manipulação de substâncias químicas que podem penetrar no organismo pela via respiratória, pele ou ingestão." },
  { c: "HST", t: "Segurança do Trabalho", d: "Conjunto de medidas técnicas, administrativas, educacionais e médicas para prevenir acidentes e garantir a integridade dos trabalhadores." },
  { c: "HST", t: "Sinalização de Segurança", d: "Conjunto de placas, cores e sinais luminosos usados para alertar sobre perigos, obrigações (ex: uso de EPI) e rotas de fuga." },
  { c: "HST", t: "Trabalho em Altura", d: "Qualquer atividade executada acima de 2 metros do nível inferior, onde haja risco de queda." },
  { c: "HST", t: "Triângulo do Fogo", d: "Modelo que representa os três elementos essenciais para a combustão: combustível, comburente (oxigénio) e calor." },

  // ===================== GERAL (Termos Diversos) =====================
  { c: "Geral", t: "Abatimento", d: "Redução do grau ou intensidade de poluição." },
  { c: "Geral", t: "Acessibilidade", d: "Pauta de um movimento reivindicatório internacional de caráter democrático, cujo objetivo é garantir às pessoas com mobilidade reduzida o pleno exercício de seus direitos, eliminando barreiras arquitetónicas e urbanísticas." },
  { c: "Geral", t: "Acidente Ambiental", d: "Evento inesperado que causa danos ao meio ambiente (ex: derrame de petróleo)." },
  { c: "Geral", t: "Açude", d: "Represa ou barragem para retenção de água, comum em zonas secas." },
  { c: "Geral", t: "Agricultura Ecológica", d: "Forma de trabalhar a terra que recusa agrotóxicos e fertilizantes químicos, promovendo o equilíbrio da biota e nutrientes do solo." },
  { c: "Geral", t: "Agricultura Sintrópica", d: "Tipo de produção agrícola sem insumos externos, baseada na sucessão ecológica e acumulação de matéria orgânica." },
  { c: "Geral", t: "Agroecologia", d: "Conjunto de práticas e teorias para uma agricultura sustentável, baseada na ecologia e sem agrotóxicos." },
  { c: "Geral", t: "Agrofloresta", d: "Sistema de uso da terra que combina árvores com culturas agrícolas e/ou pecuária." },
  { c: "Geral", t: "Agrotóxico", d: "Produto químico usado na agricultura para controlar pragas, doenças ou ervas daninhas." },
  { c: "Geral", t: "Antropoceno", d: "Época geológica proposta caracterizada pelo impacto dominante da humanidade no planeta." },
  { c: "Geral", t: "Antropogénico", d: "Resultante da atividade humana." },
  { c: "Geral", t: "Arboreto", d: "Coleção específica de exemplares da flora arbórea para fins culturais, educacionais ou científicos." },
  { c: "Geral", t: "Arborização Urbana", d: "Plantio de árvores em áreas urbanas para melhorar a qualidade de vida, sombreamento e reduzir poluição." },
  { c: "Geral", t: "Arquitetura Hostil", d: "Dispositivos ou construções em espaços públicos feitos para impedir o uso ou permanência de pessoas (ex: pedras sob viadutos)." },
  { c: "Geral", t: "Arte de Rua", d: "Manifestação artística livre em espaços públicos (grafite, estátuas vivas) que interage com o cidadão." },
  { c: "Geral", t: "Assoreamento", d: "Acumulação de sedimentos (areia, terra) no fundo de rios, diminuindo a sua profundidade." },
  { c: "Geral", t: "Balanço Energético", d: "Relação entre a quantidade de energia que entra e sai de um sistema, ou análise das matrizes energéticas de um país." },
  { c: "Geral", t: "Banheiro Seco", d: "Sistema de tratamento de dejetos humanos sem uso de água, transformando-os em adubo via compostagem." },
  { c: "Geral", t: "Barragem", d: "Estrutura construída para impedir a passagem de água, criando reservatórios para abastecimento ou energia." },
  { c: "Geral", t: "Bem Estar Animal", d: "Estado de harmonia do animal com seu ambiente, livre de medo, dor, fome e com liberdade para expressar comportamento natural." },
  { c: "Geral", t: "Bem Viver", d: "Filosofia de vida (origem indígena) baseada na harmonia com a natureza, solidariedade e comunidade, contrapondo-se ao consumismo." },
  { c: "Geral", t: "Bioarquitetura", d: "Arquitetura que busca harmonia com o ecossistema, usando materiais naturais e priorizando conforto com baixo impacto." },
  { c: "Geral", t: "Biocombustível", d: "Combustível derivado de biomassa renovável (ex: etanol, biodiesel)." },
  { c: "Geral", t: "Biodegradável", d: "Material capaz de ser decomposto por ação de microrganismos naturais." },
  { c: "Geral", t: "Biodigestor", d: "Equipamento onde ocorre a fermentação anaeróbia de matéria orgânica gerando biogás." },
  { c: "Geral", t: "Bioenergia", d: "Energia renovável produzida a partir de materiais biológicos." },
  { c: "Geral", t: "Biofiltração", d: "Processo de tratamento de poluição usando material biológico vivo." },
  { c: "Geral", t: "Biogás", d: "Gás combustível (metano) produzido pela decomposição anaeróbia de matéria orgânica." },
  { c: "Geral", t: "Biolixiviação", d: "Uso de bactérias para extrair metais de minérios, menos poluente que métodos tradicionais." },
  { c: "Geral", t: "Biomassa", d: "Matéria orgânica que pode ser usada como fonte de energia." },
  { c: "Geral", t: "Biorremediação", d: "Uso de microrganismos ou plantas para limpar locais contaminados." },
  { c: "Geral", t: "Bueiro", d: "Componente de drenagem urbana para escoamento de águas da chuva, muitas vezes obstruído por lixo." },
  { c: "Geral", t: "Caixa de Gordura", d: "Instalação que retém a gordura de pias de cozinha, evitando entupimento da rede de esgoto." },
  { c: "Geral", t: "Calçadas", d: "Espaço para circulação de pedestres que deve ser nivelado, sem obstáculos e acessível." },
  { c: "Geral", t: "Canalização de Rios", d: "Obra que transfere o leito de um rio para um canal artificial, muitas vezes causando enchentes a jusante." },
  { c: "Geral", t: "Capital Natural", d: "Stock mundial de recursos naturais (solo, ar, água, seres vivos)." },
  { c: "Geral", t: "Carvão Ativado", d: "Material de carbono poroso usado para filtrar poluentes de água e ar." },
  { c: "Geral", t: "Chorume", d: "Líquido poluente, escuro e de mau cheiro, resultante da decomposição do lixo." },
  { c: "Geral", t: "Chuva Ácida", d: "Precipitação com pH baixo devido à poluição atmosférica (SO2, NOx)." },
  { c: "Geral", t: "Ciclovia", d: "Faixa destinada à circulação exclusiva de bicicletas, promovendo mobilidade sustentável." },
  { c: "Geral", t: "Cidadania", d: "Exercício de direitos e deveres civis, políticos e sociais, incluindo a atuação na defesa do meio ambiente." },
  { c: "Geral", t: "Coagulação", d: "Processo químico no tratamento de água para aglomerar partículas suspensas." },
  { c: "Geral", t: "Co-geração", d: "Produção simultânea de eletricidade e calor útil a partir da mesma fonte de energia." },
  { c: "Geral", t: "Compostagem", d: "Reciclagem de matéria orgânica (restos de comida) transformada em adubo natural." },
  { c: "Geral", t: "Consumo Consciente", d: "Escolha de produtos e serviços considerando seus impactos ambientais e sociais." },
  { c: "Geral", t: "Contaminante Emergente", d: "Poluentes novos (fármacos, hormonas) ainda não totalmente monitorizados." },
  { c: "Geral", t: "DBO (Demanda Biológica de Oxigénio)", d: "Quantidade de oxigénio necessária para microrganismos degradarem matéria orgânica na água." },
  { c: "Geral", t: "Decantação", d: "Processo físico de separação onde partículas sólidas se depositam no fundo de um líquido." },
  { c: "Geral", t: "Deflorestação", d: "Remoção permanente de florestas para dar lugar a outros usos da terra." },
  { c: "Geral", t: "Degradação do Solo", d: "Declínio na qualidade do solo devido a uso impróprio, erosão ou poluição." },
  { c: "Geral", t: "Desenvolvimento Regenerativo", d: "Abordagem que visa criar sistemas que restaurem e regenerem o ambiente, produzindo mais recursos do que consomem." },
  { c: "Geral", t: "Desenvolvimento Sustentável", d: "Modelo que satisfaz necessidades presentes sem comprometer gerações futuras." },
  { c: "Geral", t: "Deserto Verde", d: "Extensas áreas de monocultura (ex: eucalipto, soja) que reduzem drasticamente a biodiversidade local." },
  { c: "Geral", t: "Dessalinização", d: "Remoção de sais da água do mar ou salobra para torná-la potável." },
  { c: "Geral", t: "Dragagem", d: "Escavação e remoção de material do fundo de rios, portos ou lagoas." },
  { c: "Geral", t: "Drenagem Ácida de Mina", d: "Escoamento ácido de minas metálicas ou de carvão, altamente poluente." },
  { c: "Geral", t: "Drenagem Urbana", d: "Sistema para coletar e escoar águas pluviais nas cidades, evitando alagamentos." },
  { c: "Geral", t: "Ecoagricultura", d: "Práticas agrícolas que visam conservar a biodiversidade e integrar produção com preservação ecológica." },
  { c: "Geral", t: "Ecofeminismo", d: "Movimento que conecta a exploração da natureza com a opressão das mulheres, propondo uma ética do cuidado." },
  { c: "Geral", t: "Economia Azul", d: "Uso sustentável dos recursos oceânicos para crescimento económico e conservação." },
  { c: "Geral", t: "Ecopaisagismo", d: "Paisagismo que respeita o clima e vegetação local, utilizando plantas nativas e funcionais." },
  { c: "Geral", t: "Ecossocialismo", d: "Corrente que une socialismo e ecologia, defendendo que a justiça social requer sustentabilidade ambiental." },
  { c: "Geral", t: "Ecoturismo", d: "Turismo responsável em áreas naturais que conserva o ambiente e melhora o bem-estar local." },
  { c: "Geral", t: "Educação Ambiental", d: "Processo de formação de indivíduos conscientes e preocupados com o meio ambiente e sustentabilidade." },
  { c: "Geral", t: "Efluente", d: "Resíduo líquido (doméstico ou industrial) descartado no meio ambiente." },
  { c: "Geral", t: "Emissário Submarino", d: "Tubulação que transporta esgotos (tratados) para dispersão no mar profundo." },
  { c: "Geral", t: "Energia Eólica", d: "Eletricidade gerada a partir da força do vento." },
  { c: "Geral", t: "Energia Geotérmica", d: "Energia obtida a partir do calor interno da Terra." },
  { c: "Geral", t: "Energia Hídrica", d: "Energia obtida a partir do movimento da água (rios, marés)." },
  { c: "Geral", t: "Energia Renovável", d: "Energia de fontes que se regeneram naturalmente (sol, vento, água, biomassa)." },
  { c: "Geral", t: "Energia Solar", d: "Energia captada da luz e calor do Sol." },
  { c: "Geral", t: "Engenharia Ambiental", d: "Ramo da engenharia focado na proteção e melhoria da qualidade ambiental." },
  { c: "Geral", t: "Erosão", d: "Desgaste e transporte do solo por agentes como água, vento ou gelo." },
  { c: "Geral", t: "Escassez Hídrica", d: "Falta de recursos de água doce suficientes para atender à procura padrão." },
  { c: "Geral", t: "Estação de Tratamento de Água (ETA)", d: "Instalação onde a água bruta é tratada para se tornar potável." },
  { c: "Geral", t: "Estação de Tratamento de Esgoto (ETE)", d: "Instalação que trata águas residuais antes de devolvê-las ao ambiente." },
  { c: "Geral", t: "Estratosfera", d: "Camada da atmosfera acima da troposfera, onde se localiza a camada de ozono." },
  { c: "Geral", t: "Etnociência", d: "Estudo do conhecimento tradicional de comunidades sobre a natureza (ex: uso de plantas medicinais)." },
  { c: "Geral", t: "Fertirrigação", d: "Aplicação de fertilizantes dissolvidos na água de irrigação." },
  { c: "Geral", t: "Fitorremediação", d: "Uso de plantas para remover, transferir ou estabilizar poluentes no solo ou água." },
  { c: "Geral", t: "Fitossanidade", d: "Saúde das plantas; controlo de pragas e doenças agrícolas." },
  { c: "Geral", t: "Fossa", d: "Buraco no solo para deposição de dejetos em áreas sem esgoto; deve ser bem construída para não poluir." },
  { c: "Geral", t: "Fundo de Vale", d: "Parte mais baixa do relevo onde correm as águas, área sensível para preservação e drenagem." },
  { c: "Geral", t: "Fungicida", d: "Pesticida utilizado para combater fungos." },
  { c: "Geral", t: "Herbicida", d: "Pesticida usado para matar plantas indesejadas." },
  { c: "Geral", t: "Hidrologia", d: "Ciência que estuda as distribuição e movimento da água na Terra." },
  { c: "Geral", t: "Hidroponia", d: "Cultivo de plantas sem solo, com raízes submersas em solução nutritiva." },
  { c: "Geral", t: "Hortas Comunitárias", d: "Cultivo coletivo de alimentos em espaços urbanos, promovendo segurança alimentar e convívio social." },
  { c: "Geral", t: "Impermeabilização do Solo", d: "Perda da capacidade do solo de absorver água (devido a asfalto, compactação)." },
  { c: "Geral", t: "Impermeabilização Urbana", d: "Perda da capacidade do solo absorver água devido a asfalto e construções, causando enchentes." },
  { c: "Geral", t: "Infiltração", d: "Passagem da água da superfície para o interior do solo." },
  { c: "Geral", t: "Inseticida", d: "Pesticida usado para matar insetos." },
  { c: "Geral", t: "Intervenção Antrópica", d: "Qualquer alteração realizada pelo ser humano na natureza." },
  { c: "Geral", t: "Inversão Térmica", d: "Fenómeno atmosférico que aprisiona poluentes junto ao solo em dias frios." },
  { c: "Geral", t: "Lençol Freático", d: "Reservatório de água subterrânea próximo à superfície." },
  { c: "Geral", t: "Lixão", d: "Depósito de lixo a céu aberto sem tratamento, causando grave poluição do solo e água." },
  { c: "Geral", t: "Lixiviação", d: "Lavagem de nutrientes ou poluentes do solo pela passagem da água." },
  { c: "Geral", t: "Lixiviado", d: "Líquido resultante da passagem de água através de resíduos (ver Chorume)." },
  { c: "Geral", t: "Manancial", d: "Fonte de água superficial ou subterrânea usada para abastecimento público." },
  { c: "Geral", t: "Material Particulado (PM)", d: "Mistura de partículas sólidas e líquidas suspensas no ar (poluição)." },
  { c: "Geral", t: "Metais Pesados", d: "Elementos químicos densos e tóxicos (Chumbo, Mercúrio, Cádmio)." },
  { c: "Geral", t: "Microplástico", d: "Pequenos pedaços de plástico (menos de 5mm) que poluem oceanos e solos." },
  { c: "Geral", t: "Mobilidade Urbana", d: "Condições de deslocamento nas cidades, priorizando transporte coletivo e não motorizado." },
  { c: "Geral", t: "Monocultura", d: "Cultivo de uma única espécie vegetal em grandes extensões de terra." },
  { c: "Geral", t: "Movimento Agroecológico", d: "Ação social e política que promove a agricultura sustentável e justiça no campo." },
  { c: "Geral", t: "Nanotecnologia", d: "Manipulação da matéria em escala atómica, com aplicações e riscos ambientais." },
  { c: "Geral", t: "Nascente", d: "Local onde a água subterrânea aflora na superfície, dando origem a rios." },
  { c: "Geral", t: "Osmose Reversa", d: "Tecnologia de purificação de água que usa membranas semipermeáveis." },
  { c: "Geral", t: "Oxidação", d: "Reação química que envolve a perda de eletrões, comum na degradação de materiais." },
  { c: "Geral", t: "Ozono Troposférico", d: "Poluente secundário formado na baixa atmosfera, prejudicial à saúde (smog)." },
  { c: "Geral", t: "PANCs", d: "Plantas Alimentícias Não Convencionais; plantas comestíveis pouco usadas na alimentação cotidiana mas ricas em nutrientes." },
  { c: "Geral", t: "Parques Lineares", d: "Áreas verdes ao longo de rios ou canais que protegem as margens e oferecem lazer." },
  { c: "Geral", t: "Pegada Ecológica", d: "Medida da área necessária para sustentar o consumo de uma população." },
  { c: "Geral", t: "Pegada Hídrica", d: "Volume total de água doce utilizado para produzir bens e serviços." },
  { c: "Geral", t: "Percolação", d: "Movimento da água através do solo por gravidade." },
  { c: "Geral", t: "Permacultura", d: "Sistema de design agrícola que imita os padrões dos ecossistemas naturais." },
  { c: "Geral", t: "Permeabilidade", d: "Capacidade de um material (solo, rocha) de deixar passar fluidos." },
  { c: "Geral", t: "Persistência", d: "Tempo que um poluente permanece no ambiente sem se degradar." },
  { c: "Geral", t: "Pesca Sustentável", d: "Prática de pesca que mantém as populações de peixes saudáveis a longo prazo." },
  { c: "Geral", t: "Pesticida", d: "Substância usada para prevenir ou destruir pragas." },
  { c: "Geral", t: "pH", d: "Medida de acidez ou alcalinidade de uma solução." },
  { c: "Geral", t: "Planeamento Urbano", d: "Organização do uso do solo e infraestruturas nas cidades." },
  { c: "Geral", t: "Plantio Direto", d: "Técnica agrícola sem lavoura prévia para proteger a estrutura do solo." },
  { c: "Geral", t: "Plástico de Uso Único", d: "Produtos de plástico feitos para serem usados uma vez e descartados." },
  { c: "Geral", t: "Pluviômetro", d: "Instrumento para medir a quantidade de chuva." },
  { c: "Geral", t: "Pluviosidade", d: "Quantidade de chuva que cai numa região num determinado período." },
  { c: "Geral", t: "Poço Artesiano", d: "Poço perfurado onde a água jorra naturalmente devido à pressão subterrânea." },
  { c: "Geral", t: "Poluição Difusa", d: "Poluição proveniente de fontes espalhadas (ex: escoamento agrícola), difícil de localizar." },
  { c: "Geral", t: "Poluição Pontual", d: "Poluição com origem numa fonte fixa e identificável (ex: cano de fábrica)." },
  { c: "Geral", t: "Poluição Sonora", d: "Ruído excessivo que prejudica a saúde humana e a vida selvagem." },
  { c: "Geral", t: "Poluição Térmica", d: "Aumento artificial da temperatura da água (ex: por indústrias), afetando a vida aquática." },
  { c: "Geral", t: "Poluição Visual", d: "Excesso de elementos visuais (anúncios, fios) que causam desconforto e degradação estética." },
  { c: "Geral", t: "Pousio", d: "Prática de deixar a terra descansar sem cultivo para recuperar a fertilidade." },
  { c: "Geral", t: "Praças", d: "Espaços públicos urbanos de convivência e lazer, importantes para o microclima e socialização." },
  { c: "Geral", t: "Preservação", d: "Proteção integral da natureza contra interferência humana." },
  { c: "Geral", t: "Prevenção", d: "Medidas adotadas para evitar a geração de resíduos ou poluição." },
  { c: "Geral", t: "Qualidade de Vida", d: "Condições que garantem bem-estar físico, mental, social e ambiental." },
  { c: "Geral", t: "Qualidade do Ar", d: "Medida da concentração de poluentes na atmosfera." },
  { c: "Geral", t: "Queimadas", d: "Prática de queimar vegetação para limpeza de terreno, prejudicial ao solo e ar." },
  { c: "Geral", t: "Racismo Ambiental", d: "Injustiça onde populações vulneráveis sofrem desproporcionalmente com danos ambientais." },
  { c: "Geral", t: "Radiação UV", d: "Raios ultravioleta do sol, filtrados pela camada de ozono." },
  { c: "Geral", t: "Recursos Hídricos", d: "Águas superficiais e subterrâneas disponíveis para uso numa região." },
  { c: "Geral", t: "Recursos Não Renováveis", d: "Recursos que existem em quantidade finita (petróleo, minerais)." },
  { c: "Geral", t: "Recursos Renováveis", d: "Recursos que se regeneram naturalmente (sol, vento, água, biomassa)." },
  { c: "Geral", t: "Reflorestamento", d: "Plantio de árvores em áreas onde a floresta foi removida recentemente." },
  { c: "Geral", t: "Remediação", d: "Ação de remover contaminantes do solo ou água subterrânea." },
  { c: "Geral", t: "Resíduos na Água", d: "Lixo e efluentes descartados incorretamente em corpos hídricos." },
  { c: "Geral", t: "Resíduos na Atmosfera", d: "Gases e partículas poluentes emitidos para o ar." },
  { c: "Geral", t: "Restauração Ecológica", d: "Atividade intencional de recuperar um ecossistema degradado." },
  { c: "Geral", t: "Retenção de Água", d: "Capacidade do solo de segurar a água, vital para as plantas." },
  { c: "Geral", t: "Revolução Verde", d: "Modernização da agricultura (anos 60/70) com uso intensivo de máquinas e químicos." },
  { c: "Geral", t: "Rios Urbanos", d: "Cursos d'água dentro das cidades, frequentemente canalizados ou poluídos." },
  { c: "Geral", t: "Riscos Urbanos", d: "Perigos no ambiente urbano (ex: buracos, inundações, construções precárias)." },
  { c: "Geral", t: "Salinização", d: "Acúmulo de sais no solo, frequentemente causado por irrigação inadequada." },
  { c: "Geral", t: "Saneamento Básico", d: "Serviços de água potável, esgoto, limpeza urbana e manejo de resíduos." },
  { c: "Geral", t: "Saneamento Ecológico", d: "Tratamento de resíduos focando no reaproveitamento de nutrientes e segurança sanitária." },
  { c: "Geral", t: "Sedimentação", d: "Deposição de partículas sólidas transportadas pela água." },
  { c: "Geral", t: "Segurança Alimentar", d: "Acesso físico e económico a alimentos suficientes e nutritivos." },
  { c: "Geral", t: "Silvicultura", d: "Ciência e prática de cultivar e gerir florestas." },
  { c: "Geral", t: "Sinergia", d: "Interação onde o efeito combinado é maior que a soma das partes." },
  { c: "Geral", t: "Sistemas Agroflorestais (SAFs)", d: "Consórcio de culturas agrícolas com árvores, imitando a floresta." },
  { c: "Geral", t: "Smog", d: "Nevoeiro de poluição atmosférica, mistura de fumo e neblina." },
  { c: "Geral", t: "Sobrepesca", d: "Captura de peixes acima da capacidade de reprodução da espécie." },
  { c: "Geral", t: "Socioambientalismo", d: "Articulação entre questões sociais e ambientais." },
  { c: "Geral", t: "Sociologia Ambiental", d: "Estudo das interações entre sociedade e meio ambiente." },
  { c: "Geral", t: "Solo", d: "Camada superficial da Terra onde crescem as plantas, vital para a vida." },
  { c: "Geral", t: "Sondagem", d: "Perfuração do solo para investigar suas características." },
  { c: "Geral", t: "Substância Perigosa", d: "Qualquer material que represente risco à saúde ou ambiente." },
  { c: "Geral", t: "Sumidouro", d: "Buraco ou estrutura para infiltração de água ou efluentes no solo." },
  { c: "Geral", t: "Sustentabilidade", d: "Capacidade de manter processos ecológicos e sociais a longo prazo." },
  { c: "Geral", t: "Talude", d: "Superfície inclinada de terreno natural ou artificial." },
  { c: "Geral", t: "Terraceamento", d: "Técnica agrícola de criar degraus em encostas para evitar erosão." },
  { c: "Geral", t: "Tóxico", d: "Substância capaz de causar danos a organismos vivos." },
  { c: "Geral", t: "Transgénico (OGM)", d: "Organismo cujo material genético foi alterado em laboratório." },
  { c: "Geral", t: "Tratamento Biológico", d: "Uso de microrganismos para decompor matéria orgânica em esgotos." },
  { c: "Geral", t: "Tratamento Terciário", d: "Etapa avançada de tratamento de esgoto para remover nutrientes e patógenos." },
  { c: "Geral", t: "Turismo Sustentável", d: "Turismo que minimiza impactos e valoriza cultura e ambiente locais." },
  { c: "Geral", t: "Urbanismo Sustentável", d: "Planeamento de cidades que prioriza o ambiente e qualidade de vida." },
  { c: "Geral", t: "Valetas", d: "Canais laterais em vias para escoamento de água, muitas vezes problemáticos em áreas urbanas." },
  { c: "Geral", t: "Vazante", d: "Período de descida do nível das águas de um rio." },
  { c: "Geral", t: "Vermicompostagem", d: "Compostagem que utiliza minhocas para acelerar o processo." },
  { c: "Geral", t: "Vulnerabilidade Ambiental", d: "Suscetibilidade de um ambiente a sofrer danos." },
];

// --- BOT KNOWLEDGE BASE ---
export const botKnowledge: BotKnowledgeItem[] = [
  {
    keywords: ['ola', 'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey'],
    answer: "Olá! 👋 Sou o EcoBot, o teu assistente virtual. Estou aqui para ajudar-te a navegar no EcoDicionário e responder a dúvidas sobre termos ambientais. Como posso ajudar hoje? 🌱"
  },
  {
    keywords: ['recicla', 'reciclagem', 'lixo', 'separar', 'resíduos'],
    answer: "A reciclagem é fundamental para reduzir o desperdício! ♻️ Em Angola, já existem iniciativas de recolha seletiva. Lembra-te da política dos 5 Rs: Repensar, Recusar, Reduzir, Reutilizar e Reciclar."
  },
  {
    keywords: ['agua', 'água', 'hídrico', 'seca', 'rio'],
    answer: "A água é um recurso vital e escasso. 💧 A gestão eficiente dos recursos hídricos é crucial, especialmente em regiões como o sul de Angola que enfrentam secas cíclicas. Devemos evitar o desperdício e a poluição dos rios."
  },
  {
    keywords: ['arvore', 'árvore', 'floresta', 'desmatamento', 'plantar'],
    answer: "As florestas são os pulmões do planeta! 🌳 O desmatamento ameaça a biodiversidade. Sabias que o Imbondeiro é uma árvore sagrada em Angola? Proteger as nossas florestas (como o Maiombe) é proteger o nosso futuro."
  },
  {
    keywords: ['mudanças climáticas', 'clima', 'aquecimento', 'estufa'],
    answer: "As mudanças climáticas afetam todos nós. 🌍 O aumento da temperatura global causa eventos extremos como secas e cheias. Angola tem uma Estratégia Nacional de Alterações Climáticas para mitigar esses efeitos."
  },
  {
    keywords: ['biodiversidade', 'animais', 'fauna', 'flora', 'palanca'],
    answer: "Angola tem uma biodiversidade riquíssima! 🦁 Temos a Palanca Negra Gigante (símbolo nacional), a Welwitschia Mirabilis no deserto do Namibe e muito mais. A conservação destes tesouros é dever de todos."
  },
  {
    keywords: ['sustentabilidade', 'sustentavel', 'futuro'],
    answer: "Sustentabilidade é suprir as necessidades do presente sem comprometer as gerações futuras. 🌱 Envolve equilíbrio entre desenvolvimento econômico, justiça social e conservação ambiental."
  },
  {
    keywords: ['angola', 'país', 'nacional', 'lei'],
    answer: "Em Angola, a Lei de Bases do Ambiente e a Constituição (Art. 39) garantem o direito a um ambiente sadio. 🇦🇴 Temos parques nacionais incríveis como a Kissama e o Iona."
  },
  {
    keywords: ['contato', 'ajuda', 'suporte', 'falar'],
    answer: "Podes explorar os termos no dicionário ou, se precisares de algo específico, tenta pesquisar por palavras-chave aqui. Também podes apoiar o projeto via WhatsApp! 💚"
  },
  {
    keywords: ['obrigado', 'agradecido', 'valeu'],
    answer: "De nada! Sempre que precisares, estou por aqui. Juntos por um ambiente melhor! 🌿"
  }
];
