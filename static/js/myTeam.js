document.addEventListener("DOMContentLoaded", function () {

    // Get all team settings buttons

    const settingsButtons = document.querySelectorAll(".team-settings-btn");

    settingsButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const teamId = button.dataset.teamId;

            const modal = document.getElementById("team-modal-" + teamId);

            if (modal && !modal.open) {

                modal.showModal();

            }

        });

    });


    // Get all customization modals

    const modals = document.querySelectorAll(".team-modal");

    modals.forEach(function (modal) {

        const closeButton = modal.querySelector(".modal-close-btn");

        const cancelButton = modal.querySelector(".modal-cancel-btn");

        const form = modal.querySelector(".customization-form");

        const nameInput = modal.querySelector('input[name="team_name"]');

        const logoPreview = modal.querySelector(".logo-preview");


        // Update logo initials

        function updateLogoPreview() {

            const teamName = nameInput.value.trim();

            if (teamName.length === 0) {

                logoPreview.textContent = "FC";

            } else {

                logoPreview.textContent = teamName.substring(0, 2).toUpperCase();

            }

        }


        // Close button

        closeButton.addEventListener("click", function () {

            modal.close();

        });


        // Cancel button

        cancelButton.addEventListener("click", function () {

            modal.close();

        });


        // Live logo preview

        nameInput.addEventListener("input", updateLogoPreview);


        // Close when clicking outside the modal

        modal.addEventListener("click", function (event) {

            if (event.target === modal) {

                modal.close();

            }

        });


        // Reset unsaved changes when closing

        modal.addEventListener("close", function () {

            form.reset();

            updateLogoPreview();

        });

    });

});