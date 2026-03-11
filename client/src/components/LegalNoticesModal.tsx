import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LegalNoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalNoticesModal({ isOpen, onClose }: LegalNoticesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="scrollbar-overlay relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl md:p-8 dark:bg-gray-800"
          >
            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              Mentions Légales & Confidentialité
            </h2>

            <div className="space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {/* SECTION 1 : ÉDITEUR */}
              <section>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                  1. Éditeur et Hébergement
                </h3>
                <p>
                  Le présent trombinoscope intranet est édité par{' '}
                  <strong>[Nom de votre Entreprise/Mairie]</strong>, situé au [Adresse postale
                  complète].
                  <br />
                  <strong>Directeur de la publication :</strong> [Nom du dirigeant ou DGS].
                  <br />
                  <strong>Hébergement :</strong> Ce service est hébergé en interne sur les serveurs
                  de [Nom de l'entreprise] / ou par [Nom de l'hébergeur, ex: OVH, Adresse].
                </p>
              </section>

              {/* SECTION 2 : RGPD */}
              <section>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                  2. Données Personnelles (RGPD)
                </h3>
                <p>
                  Dans le cadre de l'utilisation de cet outil de cohésion et de communication
                  interne, des données à caractère personnel vous concernant sont traitées (nom,
                  prénom, service, identifiant). Ces données sont issues de l'annuaire de
                  l'entreprise (Active Directory).
                </p>
                <p className="mt-2">
                  Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
                  "Informatique et Libertés", vous disposez d'un droit d'accès, de rectification, et
                  d'effacement de vos données. Pour exercer ces droits, veuillez contacter notre
                  Délégué à la Protection des Données (DPO) à l'adresse :
                  <strong> [dpo@votre-domaine.fr]</strong> ou contacter le service informatique.
                </p>
              </section>

              {/* SECTION 3 : DROIT A L'IMAGE */}
              <section>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                  3. Droit à l'image
                </h3>
                <p>
                  La photographie affichée sur ce trombinoscope est soumise à votre consentement
                  préalable, libre et éclairé. En téléversant votre photo sur cette plateforme, vous
                  autorisez explicitement <strong>[Nom de l'entreprise] </strong>à l'afficher à des
                  fins d'identification interne par vos collaborateurs.
                </p>
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
                  <strong>💡 Droit de retrait :</strong> Vous avez le droit de changer d'avis à tout
                  moment, sans aucune justification. Vous pouvez supprimer vous-même votre photo
                  instantanément en cliquant sur l'icône de corbeille située sur votre carte de
                  profil.
                </div>
              </section>

              {/* SECTION 4 : PROPRIÉTÉ / OPEN SOURCE (Optionnel) */}
              <section>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                  4. Informations Techniques
                </h3>
                <p>
                  Cette application ("NexTrombi-AD") est basée sur une solution open source. L'accès
                  à cette plateforme est strictement réservé au personnel autorisé via
                  authentification sécurisée.
                </p>
              </section>
            </div>

            {/* Bouton d'action bas de modale */}
            <div className="mt-8 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={onClose}
                className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                J'ai compris
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
