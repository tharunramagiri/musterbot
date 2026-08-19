/**
 * L'equipe : un roster de coequipiers, chacun un avatar `star` avec sa couleur
 * et son expression de repos propres. Stocke en JSON sous une seule cle locale,
 * `musterbot:equipe`.
 *
 * La forme est IMPOSEE (`star`) : le logo du projet et de ses membres est une
 * etoile. Seules la couleur et l'expression varient d'un membre a l'autre, et
 * sont choisies dans les palettes deja fournies par `skins.ts`/`expressions.ts`.
 */
import { COLOR_BY_ID, COLORS } from '@/bot/skins'
import { EXPRESSION_BY_ID, EXPRESSIONS } from '@/bot/expressions'
import { lis, ecris } from './stockage'

export interface Mate {
  /** identifiant stable, genere a la creation */
  id: string
  /** nom affiche sous l'avatar */
  name: string
  /** identifiant de couleur, cf. COLOR_BY_ID */
  color: string
  /** identifiant d'expression de repos, cf. EXPRESSION_BY_ID */
  expression: string
}

/** La forme est la marque du produit : une constante, pas un choix. */
export const ROSTER_SHAPE = 'star'

/**
 * Une couleur et une expression par membre, sans doublon : le roster doit se
 * lire d'un coup d'oeil, deux etoiles identiques n'y aideraient pas.
 *
 * On eclate les deux : d'abord la premiere COULEUR encore libre, puis la
 * premiere EXPRESSION encore libre. Deux axes separes — une couleur qui a deja
 * servi reste reservee, une expression qui a deja servi aussi — plutot que de
 * coupler les deux, ce qui aurait epuise les 16 expressions d'« encre » avant
 * de passer a la couleur suivante.
 */
export function prochainCouple(mates: Mate[]): { color: string; expression: string } {
  const couleurs = new Set(mates.map((m) => m.color))
  const expressions = new Set(mates.map((m) => m.expression))
  const color = COLORS.find((c) => !couleurs.has(c.id))?.id ?? COLORS[0]!.id
  const expression =
    EXPRESSIONS.find((e) => !expressions.has(e.id))?.id ?? EXPRESSIONS[0]!.id
  return { color, expression }
}

/** Id unique et court : une base 36 issue du temps, assez pour la duree d'une page. */
let compteur = 0
function nouvelId(): string {
  compteur += 1
  return `m${Date.now().toString(36)}${compteur.toString(36)}`
}

/** Lit le roster garde du stockage. Valeur invalide ou absente -> []. */
export function lireEquipe(): Mate[] {
  const brut = lis('equipe')
  if (!brut) return []
  try {
    const parsed: unknown = JSON.parse(brut)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m): m is Mate => {
        if (typeof m !== 'object' || m === null) return false
        const o = m as Record<string, unknown>
        return (
          typeof o.id === 'string' &&
          typeof o.name === 'string' &&
          typeof o.color === 'string' &&
          COLOR_BY_ID.has(o.color) &&
          typeof o.expression === 'string' &&
          EXPRESSION_BY_ID.has(o.expression)
        )
      })
      .slice(0, 24)
  } catch {
    return []
  }
}

/** Ecrit le roster dans le stockage, sans broncher si l'acces est refuse. */
export function ecrireEquipe(mates: Mate[]) {
  ecris('equipe', JSON.stringify(mates))
}

/** Un membre d'amorce, pret a l'emploi. */
export function nouveauMate(nom: string, color: string, expression: string): Mate {
  return { id: nouvelId(), name: nom, color, expression }
}

/** Nom d'affichage : un nom vide tombe sur un libelle traduit par l'appelant. */
export function nomDuMate(mate: Mate): string {
  return mate.name
}
