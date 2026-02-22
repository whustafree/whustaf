import type { APIRoute } from 'astro';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    let { url } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: 'Falta la URL' }), { status: 400 });
    }

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    console.log(">> BOT Viajando a:", url);

    // 1. El Bot extrae la información en bruto
    const { data } = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const content = data.toLowerCase();

    const title = $('title').text().trim() || 'Sitio sin título';
    const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
    const h1 = $('h1').first().text().trim() || '';
    
    // Sacamos un poco del texto de la página para que la IA tenga contexto
    const bodyText = $('p').slice(0, 3).text().trim().substring(0, 500); 

    // Detectamos tecnologías básicas
    const tech = [] as string[];
    if (content.includes('react')) tech.push('React');
    if (content.includes('astro')) tech.push('Astro');
    if (content.includes('tailwind')) tech.push('Tailwind');
    if (content.includes('node')) tech.push('Node.js');
    if (content.includes('wordpress')) tech.push('WordPress');

    let iaDescription = metaDesc || 'Descripción no disponible';

    // 2. ¡Conectamos con Gemini!
    try {
        const apiKey = import.meta.env.GEMINI_API_KEY;
        if (apiKey) {
            console.log(">> Conectando con la IA de Gemini...");
            const genAI = new GoogleGenerativeAI(apiKey);
            // Usamos el modelo rápido y gratuito
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = `
            Eres un asistente para el portafolio web de un desarrollador. 
            Analiza los siguientes datos extraídos de la web ${url}:
            Título: ${title}
            H1: ${h1}
            Descripción original: ${metaDesc}
            Texto de la página: ${bodyText}
            
            Escribe un resumen atractivo y muy profesional de exactamente 1 o 2 líneas explicando de qué trata este proyecto o página web. No uses comillas ni introducciones, solo devuelve el resumen directo.
            `;
            
            const resultIA = await model.generateContent(prompt);
            const responseIA = await resultIA.response;
            iaDescription = responseIA.text().trim();
            console.log(">> ¡IA generó el resumen con éxito!");
        } else {
            console.log(">> OJO: No se encontró la GEMINI_API_KEY en el archivo .env");
        }
    } catch (iaError) {
        console.error(">> Error de Gemini:", iaError);
        // Si la IA falla (por internet o algo), usamos la descripción normal de respaldo
    }

    const finalResult = {
      title: title,
      description: iaDescription,
      tech: tech.length > 0 ? tech : ["Web"]
    };

    return new Response(JSON.stringify(finalResult), { status: 200 });

  } catch (error: any) {
    console.error(">> ERROR DEL BOT:", error.message);
    return new Response(JSON.stringify({ error: 'No se pudo leer la web. Revisa que esté online.' }), { status: 500 });
  }
}