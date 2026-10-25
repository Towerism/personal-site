---
documentLanguage: en
---

# Glossary

One entry per term: definition, boundaries, one resolved ambiguity. Agents write here the moment a term is settled. Vocabulary here is law for all specs, tickets, and code naming. Ship-specific terms only: a concept any sea chart carries does not get an entry.

## Content page
- Definition: a Markdown file in `content/` with `title` and `description` frontmatter; it becomes one HTML page.
- Boundary: is the owner-edited source, not a template and not generated output.
- Avoid: "post", "document".
- Resolved ambiguity: `404.md` is a content page but emits `404.html`, not a directory route.

## Service
- Definition: one `### Heading` section of `content/home-network.md`, describing a thing the owner self-hosts.
- Boundary: is both a static card on the page and a node in the graph; the hardware bullet list is not a service.
- Avoid: "app", "project".
- Resolved ambiguity: the site itself ("Personal website") is a service and also the graph's hub node.

## Graph
- Definition: the animated network of services, built from the services into `dist/assets/graph.json` and drawn on a canvas.
- Boundary: is decoration plus a text description; the service cards are the accessible source of truth.
- Avoid: "diagram", "map".
- Resolved ambiguity: with JS off or reduced motion on, the graph is not drawn; nothing else changes.

## Alive effects
- Definition: the motion layer (graph, scroll reveals, view transitions, hero ticker).
- Boundary: is progressive enhancement behind the `js` class and `prefers-reduced-motion`; layout and content never depend on it. The page cross-fade between pages needs only `prefers-reduced-motion`, since `@view-transition` cannot be scoped to a class.
- Avoid: "animations" for the whole set (reveals and transitions are not all animations).
- Resolved ambiguity: the theme toggle is not an alive effect; it works without motion.

## Status board
- Definition: the panel beside the home page heading: the `status` heading and `ticker` lines from `content/home.md`, the service count and a visit clock.
- Boundary: is static HTML listing every line; the rotating log view and the ticking clock are alive effects on top of it.
- Avoid: "dashboard", "terminal".
- Resolved ambiguity: the lines are the owner's copy, not live data from the network; the heading says "(mostly fiction)" so visitors know.

## Motion toggle
- Definition: the "Pause motion" button in the footer; pressed, it sets `motion-paused` on `<html>` and stores the choice in `localStorage` under `motion`.
- Boundary: pauses every alive effect (CSS animation, the graph loop, the ticker and the visit clock); it is shown only with the `js` class and hidden under reduced motion.
- Avoid: "animation switch".
- Resolved ambiguity: pressed means paused; the accessible name stays "Pause motion" either way.
