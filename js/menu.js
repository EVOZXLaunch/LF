const menuToggle =
document.getElementById(
    "menuToggle"
);

const mobileMenu =
document.getElementById(
    "mobileMenu"
);

const menuOverlay =
document.getElementById(
    "menuOverlay"
);

if (
    menuToggle &&
    mobileMenu &&
    menuOverlay
) {

    menuToggle.addEventListener(
        "click",
        () => {

            mobileMenu.classList.add(
                "open"
            );

            menuOverlay.classList.add(
                "show"
            );

        }
    );

    menuOverlay.addEventListener(
        "click",
        () => {

            mobileMenu.classList.remove(
                "open"
            );

            menuOverlay.classList.remove(
                "show"
            );

        }
    );

}
