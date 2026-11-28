document.addEventListener("DOMContentLoaded", function () {

    const settingsButtons = document.querySelectorAll(".team-settings-btn");

    // Open customization modal
    settingsButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const teamId = button.dataset.teamId;

            const modal = document.getElementById(
                "team-modal-" + teamId
            );

            if (modal && !modal.open) {
                modal.showModal();
            }

        });

    });


    const modals = document.querySelectorAll(".team-modal");

    modals.forEach(function (modal) {

        const closeButton = modal.querySelector(".modal-close-btn");

        const cancelButton = modal.querySelector(".modal-cancel-btn");

        const form = modal.querySelector(".customization-form");

        const nameInput = modal.querySelector('input[name="team_name"]');

        const logoPreview = modal.querySelector(".logo-preview");

        const colorInput = modal.querySelector('input[name="logo_color"]');

        const colorOptions = modal.querySelectorAll(".color-option");


        // Update logo initials
        function updateLogoPreview() {

            const teamName = nameInput.value.trim();

            if (teamName.length === 0) {

                logoPreview.textContent = "FC";

            } else {

                logoPreview.textContent =
                    teamName.substring(0, 2).toUpperCase();

            }

        }


        // Update logo color
        function updateLogoColor() {

            const selectedColor = colorInput.value;

            logoPreview.style.setProperty(
                "--team-logo-color",
                selectedColor
            );

            colorOptions.forEach(function (option) {

                const isSelected =
                    option.dataset.color.toLowerCase() ===
                    selectedColor.toLowerCase();

                option.classList.toggle("selected", isSelected);

                option.setAttribute("aria-pressed", isSelected);

            });

        }


        // Preset color selection
        colorOptions.forEach(function (option) {

            option.addEventListener("click", function () {

                colorInput.value = option.dataset.color;

                updateLogoColor();

            });

        });


        // Custom color selection
        colorInput.addEventListener("input", updateLogoColor);


        // Live team name preview
        nameInput.addEventListener("input", updateLogoPreview);


        // Close modal
        closeButton.addEventListener("click", function () {

            modal.close();

        });


        // Cancel customization
        cancelButton.addEventListener("click", function () {

            modal.close();

        });


        // Close when clicking outside
        modal.addEventListener("click", function (event) {

            if (event.target === modal) {

                modal.close();

            }

        });


        // Restore saved values when closing
        modal.addEventListener("close", function () {

            form.reset();

            updateLogoPreview();

            updateLogoColor();

        });


        // Initialize saved values
        updateLogoPreview();

        updateLogoColor();

    });

});