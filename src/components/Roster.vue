<script setup lang="ts">
import { ref } from 'vue'
import MusterBot from '@/components/MusterBot.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import NameDialog from '@/components/NameDialog.vue'
import { COLORS } from '@/bot/skins'
import { EXPRESSIONS } from '@/bot/expressions'
import { t } from '@/i18n'
import {
  ROSTER_SHAPE,
  ecrireEquipe,
  lireEquipe,
  nouveauMate,
  prochainCouple,
  type Mate
} from '@/ui/equipe'

/**
 * L'equipe : chaque coequipier est une etoile (`shape=star`) avec sa propre
 * couleur et son expression de repos. La grille vit seule ici : l'avatar
 * principal continue de suivre le personnalisateur, le roster est autonome.
 *
 * Chaque carte est UNE etoile figee (`frozenAt`) : pas de boucle d'animation a
 * multiplier par le nombre de membres. Le menu d'edition par couleur et
 * expression reste ici, a meme la carte, pour ne pas empiler les boites.
 */

const mates = ref<Mate[]>(lireEquipe())

/** Persiste a chaque modification. */
function conserve() {
  ecrireEquipe(mates.value)
}

/** Ajoute une etoile, avec le premier couple couleur/expression encore libre. */
function ajoute() {
  const { color, expression } = prochainCouple(mates.value)
  mates.value = [...mates.value, nouveauMate('', color, expression)]
  conserve()
}

/** Supprime une etoile, apres confirmation quand elle porte un nom. */
const aRetirer = ref<Mate | null>(null)
const retraitOuvert = ref(false)
function retire(mate: Mate) {
  mates.value = mates.value.filter((m) => m.id !== mate.id)
  conserve()
}
function confirmeRetrait() {
  if (aRetirer.value) retire(aRetirer.value)
  retraitOuvert.value = false
}
function demandeRetrait(mate: Mate) {
  if (!mate.name) {
    retire(mate)
    return
  }
  aRetirer.value = mate
  retraitOuvert.value = true
}

/** Renommage via la boite partagee. */
const aRenommer = ref<Mate | null>(null)
const renommageOuvert = ref(false)
function renomme(nom: string) {
  const m = mates.value.find((x) => x.id === aRenommer.value?.id)
  if (m) {
    m.name = nom
    conserve()
  }
  aRenommer.value = null
  renommageOuvert.value = false
}
function ouvreRenommage(mate: Mate) {
  aRenommer.value = mate
  renommageOuvert.value = true
}

/**
 * Couleur et expression par champs `select` : plus simple a tenir accessible
 * qu'un popover, et les deux palettes sont deja traduites.
 */
function change(mate: Mate, champ: 'color' | 'expression', valeur: string) {
  mate[champ] = valeur
  conserve()
}

/** Nom lisible : le nom saisi, sinon un libelle d'amorce traduit. */
function libelle(mate: Mate): string {
  return mate.name || t('roster.unnamed')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">{{ t('roster.title') }}</h2>
      <button
        type="button"
        class="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3 text-xs font-medium text-[var(--paper)] transition hover:opacity-90 active:scale-95"
        :aria-label="t('roster.add')"
        @click="ajoute"
      >
        <span aria-hidden="true" class="text-lg leading-none">+</span>
        {{ t('roster.add') }}
      </button>
    </div>

    <p class="mt-1 text-xs text-[var(--muted)]">{{ t('roster.hint') }}</p>

    <!--
      La grille est plus serree que celle du personnalisateur : une carte porte
      une etoile ET ses deux selecteurs, donc trois lignes. Une vignette par
      tranche de deux cases garde la largeur juste sur mobile (375 px).
    -->
    <div class="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
      <article
        v-for="mate in mates"
        :key="mate.id"
        class="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--line)] p-2"
      >
        <div class="relative">
          <MusterBot
            :shape="ROSTER_SHAPE"
            :color="mate.color"
            :expression="mate.expression"
            :size="84"
            :frozen-at="1"
          />
        </div>

        <button
          type="button"
          class="max-w-full cursor-pointer truncate rounded px-1 text-sm font-medium text-[var(--ink)] transition hover:bg-black/5"
          :aria-label="t('roster.rename', { name: libelle(mate) })"
          @click="ouvreRenommage(mate)"
        >
          {{ libelle(mate) }}
        </button>

        <div class="flex w-full flex-col gap-1">
          <label class="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
            {{ t('roster.color') }}
            <select
              class="h-7 max-w-[8rem] flex-1 cursor-pointer rounded border border-[var(--line)] bg-white px-1 text-xs text-[var(--ink)]"
              :value="mate.color"
              :aria-label="t('roster.color')"
              @change="change(mate, 'color', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="c in COLORS" :key="c.id" :value="c.id">
                {{ t(`colors.${c.id}`) }}
              </option>
            </select>
          </label>

          <label class="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
            {{ t('roster.expression') }}
            <select
              class="h-7 max-w-[8rem] flex-1 cursor-pointer rounded border border-[var(--line)] bg-white px-1 text-xs text-[var(--ink)]"
              :value="mate.expression"
              :aria-label="t('roster.expression')"
              @change="change(mate, 'expression', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="e in EXPRESSIONS" :key="e.id" :value="e.id">
                {{ t(`expressions.${e.id}`) }}
              </option>
            </select>
          </label>
        </div>

        <button
          type="button"
          class="h-6 cursor-pointer rounded px-2 text-xs text-[var(--danger)] transition hover:bg-[var(--danger)]/10"
          :aria-label="t('roster.remove', { name: libelle(mate) })"
          @click="demandeRetrait(mate)"
        >
          {{ t('roster.removeLabel') }}
        </button>
      </article>

      <p v-if="!mates.length" class="col-span-full mt-2 text-center text-xs text-[var(--muted)]">
        {{ t('roster.empty') }}
      </p>
    </div>

    <ConfirmDialog
      v-model:open="retraitOuvert"
      :title="t('roster.removeTitle', { name: aRetirer?.name ?? '' })"
      :detail="t('roster.removeDetail')"
      :confirm-label="t('roster.removeConfirm')"
      @confirm="confirmeRetrait"
    />

    <NameDialog
      v-model:open="renommageOuvert"
      :title="t('roster.renameTitle')"
      :label="t('roster.nameField')"
      :submit-label="t('roster.renameConfirm')"
      :value="aRenommer?.name ?? ''"
      @submit="renomme"
    />
  </div>
</template>
