const button =
    document.getElementById(
        "backToTop"
    );

if (button) {

    window.addEventListener(
        "scroll",
        () => {

            button.style.display =
                window.scrollY > 300
                ? "flex"
                : "none";

        }
    );

    button.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}
