# Dúvidas para a Laura

Pendências que dependem dela. Quando chegar a resposta, aplicar no código e riscar daqui.

| # | Origem | Dúvida | Onde aplicar |
|---|---|---|---|
| 1 | PRO-07 / PRO-19 | Qual é o link de compra (Kiwify) do Guia de Bali? Hoje o botão "Quero o guia" na página /produtos/guia-de-bali não leva a lugar nenhum. | `src/pagesContent.ts` (productPages → guia-de-bali → `buy.href`) |
| 2 | PRO-08 / PRO-18 | Qual é o preço do e-book "Como encontrar um trabalho na Austrália"? A página individual já está pronta para mostrar o valor ao lado do botão de compra; hoje só o Guia de Bali mostra preço (R$ 49). | `src/pagesContent.ts` (productPages → trabalho-na-australia → `price`; catalog → ebook-australia → `price`) |
| 3 | PRO-10 / PRO-29 | Criar no MailerLite uma página de inscrição para a lista de espera dos próximos lançamentos: uma só para todos, ou uma por produto (Tailândia, Vietnã, próximos destinos, consultoria)? Enviar o link. Até lá, o "Me avise" mostra a confirmação mas **não guarda o e-mail**. | `src/pagesContent.ts` (`waitlistUrl`) |
| 4 | PRO-07 | A garantia de 7 dias também vale para o Guia de Bali? (O FAQ hoje fala só do e-book; a página do guia ainda não mostra garantia.) | `src/pagesContent.ts` (faq; productPages → guia-de-bali → `guarantee` e `faq`) |
| 5 | PRO-17 | Validar os textos **provisórios** da página do Guia de Bali: frase de efeito, "É para você se…" (4 itens) e "Por dentro do guia" (5 itens). Foram montados a partir da descrição atual do guia. | `src/pagesContent.ts` (productPages → guia-de-bali) |
