import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROSTER_SHAPE, lireEquipe, nouveauMate, prochainCouple, type Mate } from './equipe'
import { COLORS } from '@/bot/skins'
import { EXPRESSIONS } from '@/bot/expressions'

/**
 * Le roster d'etoiles : ce qui est verrouille est la repartition — deux etoiles
 * identiques ne se lisent pas d'un coup d'oeil — et la relecture sans broncher
 * d'un stockage corrompu. La forme, elle, est la marque du produit et ne bouge
 * pas.
 */

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('roster', () => {
  it('impose la forme etoile a tout le roster', () => {
    expect(ROSTER_SHAPE).toBe('star')
  })

  /**
   * Le piege qu'on a eu : coupler couleur x expression epuisait les 16
   * expressions d'une meme couleur avant de passer a la suivante. Separer les
   * deux axes garantit qu'on voit une couleur DIFFERENTE a chaque nouvelle
   * etoile, tant qu'il en reste.
   */
  it('attribue une couleur et une expression sans doublon', () => {
    const mates: Mate[] = []
    const couleurs = new Set<string>()
    const expressions = new Set<string>()
    for (let i = 0; i < Math.min(COLORS.length, EXPRESSIONS.length); i++) {
      const { color, expression } = prochainCouple(mates)
      expect(couleurs.has(color)).toBe(false)
      expect(expressions.has(expression)).toBe(false)
      couleurs.add(color)
      expressions.add(expression)
      mates.push(nouveauMate('', color, expression))
    }
    // douze entrees, douze couleurs distinctes
    expect(couleurs.size).toBe(12)
  })

  it('reprend la premiere couleur libre quand on retire une etoile', () => {
    const mates = [
      nouveauMate('', 'encre', 'neutre'),
      nouveauMate('', 'brun', 'attentif')
    ]
    // on retire « brun » : sa couleur redevient libre
    const restants = [mates[0]!]
    const { color } = prochainCouple(restants)
    expect(color).toBe('brun')
  })

  it('retombe sur une valeur par defaut quand tout est pris', () => {
    // 16 expressions > 12 couleurs : pour epuiser LES DEUX axes, il faut 16
    // etoiles, les couleurs tournant en boucle apres la douzieme.
    const mates = EXPRESSIONS.map((e, i) =>
      nouveauMate('', COLORS[i % COLORS.length]!.id, e.id)
    )
    const { color, expression } = prochainCouple(mates)
    expect(color).toBe(COLORS[0]!.id)
    expect(expression).toBe(EXPRESSIONS[0]!.id)
  })

  it('relit sans broncher un stockage corrompu ou absent', () => {
    // absent
    vi.stubGlobal('localStorage', { getItem: () => null })
    expect(lireEquipe()).toEqual([])

    // JSON invalide
    vi.stubGlobal('localStorage', { getItem: () => '{pas du json' })
    expect(lireEquipe()).toEqual([])

    // tableau de valeurs non conformes
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify([{ id: '1', name: 'x', color: 'nimporte', expression: 'quoi' }])
    })
    expect(lireEquipe()).toEqual([])
  })
})
