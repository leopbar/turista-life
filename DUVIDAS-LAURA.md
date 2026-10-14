# Dúvidas para a Laura

Pendências que dependem dela. Quando chegar a resposta, aplicar no código e riscar daqui.

| # | Origem | Dúvida | Onde aplicar |
|---|---|---|---|
| 1 | PRO-07 | Qual é o link de compra (Kiwify) do Guia de Bali? Hoje o botão "Quero o guia" em /produtos não leva a lugar nenhum, e o da home aponta para o card em /produtos. | `src/pagesContent.ts` (guia-bali → `href`) e `src/content.ts` (Guia de Bali → `href`) |
| 2 | PRO-08 | Mostrar o preço do e-book "Como encontrar um trabalho na Austrália"? Hoje só o Guia de Bali mostra preço (R$ 49). Se sim, qual valor? | `src/pagesContent.ts` (ebook-australia → `price`) |
| 3 | PRO-10 / PRO-29 | Criar no MailerLite uma página de inscrição para a lista de espera dos próximos lançamentos: uma só para todos, ou uma por produto (Tailândia, Vietnã, próximos destinos, consultoria)? Enviar o link. Até lá, o "Me avise" mostra a confirmação mas **não guarda o e-mail**. | `src/pagesContent.ts` (`waitlistUrl`) |
| 4 | PRO-07 | A garantia de 7 dias também vale para o Guia de Bali? (O FAQ hoje fala só do e-book.) | `src/pagesContent.ts` (faq) |
