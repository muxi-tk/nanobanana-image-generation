import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { siteConfig } from "@/lib/site"

const faqs = [
  {
    question: "What is Nano Banana?",
    answer:
      "Nano Banana is an AI image editor that applies text prompts to transform images. It focuses on consistent edits and fast iterations for common creative workflows.",
  },
  {
    question: "How does it work?",
    answer:
      'Upload an image, describe the edit in plain language, and the system generates a revised image based on your prompt. Results can vary by input and prompt detail.',
  },
  {
    question: "What makes Nano Banana special?",
    answer:
      "It is optimized for character consistency, scene edits, and multi-image context so teams can iterate quickly with fewer manual steps.",
  },
  {
    question: "Can I use it for commercial projects?",
    answer:
      "You can use your outputs commercially as long as you have rights to the source assets and comply with our terms.",
  },
  {
    question: "What types of edits can it handle?",
    answer:
      "Common edits include background changes, object placement, style transfers, and character adjustments. Some prompts may require multiple iterations.",
  },
  {
    question: "How do I contact support?",
    answer: `Email us at ${siteConfig.supportEmail || "support@yourdomain.com"} and we will get back to you quickly.`,
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">FAQs</h2>
            <p className="text-lg text-muted-foreground text-balance">Frequently Asked Questions</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-3 bg-background/60 last:border-b"
              >
                <AccordionTrigger className="text-left text-base font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
