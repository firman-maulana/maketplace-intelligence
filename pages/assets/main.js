const accordionAnimation = {
  accordionGroups: /* @__PURE__ */ new Map(),
  initializedGroups: /* @__PURE__ */ new Set(),
  init(accordionContainer = null) {
    if (accordionContainer) {
      this.initAccordionGroup(accordionContainer);
      return;
    }
    document.querySelectorAll(".accordion").forEach((accordion) => {
      const style = globalThis.window.getComputedStyle(accordion);
      if (style.display !== "none" && style.visibility !== "hidden") {
        this.initAccordionGroup(accordion);
      }
    });
  },
  initAccordionGroup(accordion) {
    if (this.initializedGroups.has(accordion)) {
      this.ensureCorrectState(accordion);
      return;
    }
    const accordionItems = accordion.querySelectorAll(".accordion-item");
    if (!accordionItems.length) return;
    const groupData = {
      accordion,
      accordionItems,
      activeItem: null,
      itemElements: /* @__PURE__ */ new Map()
    };
    accordionItems.forEach((item) => {
      const elements = {
        action: item.querySelector(".accordion-action"),
        content: item.querySelector(".accordion-content"),
        plusIconSpans: item.querySelectorAll(".accordion-plus-icon span"),
        accordionArrow: item.querySelector(".accordion-arrow svg"),
        accordionArrowSpan: item.querySelector(".accordion-arrow")
      };
      groupData.itemElements.set(item, elements);
      if (item.classList.contains("active-accordion")) {
        elements.content.classList.remove("hidden");
        elements.content.style.height = "auto";
        groupData.activeItem = item;
        this.setOpenState(item, elements);
      } else {
        elements.content.classList.add("hidden");
        elements.content.style.height = "0px";
        elements.content.style.opacity = "0";
        this.setClosedState(item, elements);
      }
      if (elements.action) {
        elements.action.addEventListener("click", (e) => {
          e.preventDefault();
          if (groupData.activeItem && groupData.activeItem !== item) {
            this.closeAccordion(
              groupData.activeItem,
              groupData.itemElements.get(groupData.activeItem)
            );
          }
          if (groupData.activeItem === item) {
            this.closeAccordion(item, elements);
            groupData.activeItem = null;
          } else {
            this.openAccordion(item, elements);
            groupData.activeItem = item;
          }
        });
      }
    });
    this.accordionGroups.set(accordion, groupData);
    this.initializedGroups.add(accordion);
    this.initAnimation(accordionItems);
  },
  setOpenState(item, elements) {
    const { action, content, plusIconSpans, accordionArrow, accordionArrowSpan } = elements;
    item.dataset.state = "true";
    action.dataset.state = "true";
    content.dataset.state = "true";
    if (plusIconSpans.length > 0) {
      plusIconSpans[1].style.transform = "rotate(90deg)";
      plusIconSpans[1].dataset.state = "true";
    }
    if (accordionArrow) {
      accordionArrow.style.transform = "rotate(180deg)";
      accordionArrow.dataset.state = "true";
    }
    if (accordionArrowSpan) {
      accordionArrowSpan.dataset.state = "true";
    }
  },
  ensureCorrectState(accordion) {
    const groupData = this.accordionGroups.get(accordion);
    if (!groupData) return;
    if (typeof gsap !== "undefined") {
      groupData.accordionItems.forEach((item) => {
        const elements = groupData.itemElements.get(item);
        if (!elements) return;
        gsap.killTweensOf(elements.content);
        if (elements.accordionArrow) gsap.killTweensOf(elements.accordionArrow);
        if (elements.plusIconSpans.length > 0 && elements.plusIconSpans[1]) {
          gsap.killTweensOf(elements.plusIconSpans[1]);
        }
      });
    }
    groupData.activeItem = null;
    groupData.accordionItems.forEach((item) => {
      const elements = groupData.itemElements.get(item);
      if (!elements) return;
      if (item.classList.contains("active-accordion")) {
        elements.content.classList.remove("hidden");
        elements.content.style.height = "auto";
        elements.content.style.opacity = "1";
        groupData.activeItem = item;
        this.setOpenState(item, elements);
      } else {
        elements.content.classList.add("hidden");
        elements.content.style.height = "0px";
        elements.content.style.opacity = "0";
        this.setClosedState(item, elements);
        if (elements.accordionArrow) elements.accordionArrow.style.transform = "rotate(0deg)";
        if (elements.plusIconSpans.length > 0 && elements.plusIconSpans[1]) {
          elements.plusIconSpans[1].style.transform = "rotate(0deg)";
        }
      }
    });
  },
  setClosedState(item, elements) {
    const { action, content, plusIconSpans, accordionArrow, accordionArrowSpan } = elements;
    item.dataset.state = "false";
    action.dataset.state = "false";
    content.dataset.state = "false";
    if (plusIconSpans.length > 0) {
      plusIconSpans[1].dataset.state = "false";
    }
    if (accordionArrow) {
      accordionArrow.dataset.state = "false";
    }
    if (accordionArrowSpan) {
      accordionArrowSpan.dataset.state = "false";
    }
  },
  initAnimation(accordionItems) {
    if (!accordionItems) return;
    accordionItems.forEach((item, index) => {
      gsap.set(item, {
        opacity: 0,
        y: 50,
        filter: "blur(20px)",
        overflow: "hidden"
      });
      gsap.fromTo(
        item,
        {
          opacity: 0,
          y: 50,
          filter: "blur(20px)"
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.5,
          delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 90%",
            end: "top 50%",
            scrub: false,
            once: true
          }
        }
      );
    });
  },
  openAccordion(item, elements) {
    const { action, content, plusIconSpans, accordionArrow, accordionArrowSpan } = elements;
    item.dataset.state = "true";
    action.dataset.state = "true";
    content.dataset.state = "true";
    content.classList.remove("hidden");
    content.style.height = "auto";
    const contentHeight = content.scrollHeight;
    content.style.height = "0px";
    gsap.to(content, {
      height: contentHeight,
      opacity: 1,
      duration: 0.3
    });
    if (plusIconSpans.length > 0) {
      gsap.to(plusIconSpans[1], {
        rotation: 90,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          plusIconSpans[1].dataset.state = "true";
        }
      });
    }
    if (accordionArrow) {
      accordionArrow.dataset.state = "true";
      gsap.to(accordionArrow, {
        rotation: -180,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    if (accordionArrowSpan) {
      accordionArrowSpan.dataset.state = "true";
    }
  },
  closeAccordion(item, elements) {
    const { action, content, plusIconSpans, accordionArrow, accordionArrowSpan } = elements;
    item.dataset.state = "false";
    action.dataset.state = "false";
    content.style.height = "auto";
    const contentHeight = content.scrollHeight;
    content.style.height = contentHeight + "px";
    gsap.to(content, {
      height: 0,
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        content.classList.add("hidden");
        content.style.height = "0px";
        content.dataset.state = "false";
      }
    });
    if (plusIconSpans.length > 0) {
      gsap.to(plusIconSpans[1], {
        rotation: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          plusIconSpans[1].dataset.state = "false";
        }
      });
    }
    if (accordionArrow) {
      accordionArrow.dataset.state = "false";
      gsap.to(accordionArrow, {
        rotation: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    }
    if (accordionArrowSpan) {
      accordionArrowSpan.dataset.state = "false";
    }
  }
};
if (globalThis.document !== void 0) {
  globalThis.accordionAnimation = accordionAnimation;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      accordionAnimation.init();
    });
  } else {
    accordionAnimation.init();
  }
}
const roundAnimation = {
  init() {
    const item = document.querySelector(".financial-management-platform-hero-spin");
    if (!item) return;
    let lastScrollTop = 0;
    let scrollTimeout;
    let currentTween;
    let lastDirection = "down";
    const startRotation = (direction, duration) => {
      currentTween == null ? void 0 : currentTween.kill();
      currentTween = gsap.to(item, {
        rotate: direction === "up" ? "-=360" : "+=360",
        duration,
        ease: "linear",
        transformOrigin: "center center",
        repeat: -1
      });
    };
    window.addEventListener("scroll", () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      let direction = null;
      if (st > lastScrollTop) direction = "down";
      else if (st < lastScrollTop) direction = "up";
      if (direction) {
        lastDirection = direction;
        startRotation(direction, 12);
      }
      lastScrollTop = Math.max(st, 0);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        startRotation(lastDirection, 60);
      }, 150);
    });
    startRotation("down", 50);
  }
};
globalThis.addEventListener("DOMContentLoaded", () => {
  roundAnimation.init();
});
const currentFilters = {
  industry: "all",
  product: "all",
  service: "all",
  solution: "all"
};
function closeDropdown(button, dropdown) {
  if (!dropdown) return;
  dropdown.classList.remove("active");
  dropdown.style.opacity = "0";
  dropdown.style.pointerEvents = "none";
  const chevronIcon = button == null ? void 0 : button.querySelector("svg");
  if (chevronIcon) {
    chevronIcon.style.transform = "rotate(0deg)";
  }
}
function openDropdown(button, dropdown) {
  if (!dropdown) return;
  dropdown.classList.add("active");
  dropdown.style.opacity = "1";
  dropdown.style.pointerEvents = "auto";
  const chevronIcon = button == null ? void 0 : button.querySelector("svg");
  if (chevronIcon) {
    chevronIcon.style.transform = "rotate(180deg)";
  }
}
function closeAllDropdownsExcept(excludeDropdown) {
  const allButtons = document.querySelectorAll(".dropdown-button");
  allButtons.forEach((button) => {
    const dropdown = button.parentElement.querySelector(".customer-dropdown-menu");
    if (dropdown && dropdown !== excludeDropdown) {
      closeDropdown(button, dropdown);
    }
  });
}
function countStoriesByFilter(filterType, filterValue) {
  const allCards = document.querySelectorAll(".story-card");
  if (filterValue === "all") {
    return allCards.length;
  }
  let count = 0;
  allCards.forEach((card) => {
    const cardValue = card.getAttribute(`data-${filterType}`);
    if (cardValue && cardValue.toLowerCase() === filterValue.toLowerCase()) {
      count++;
    }
  });
  return count;
}
function updateDropdownCounts() {
  const allDropdownItems = document.querySelectorAll("[data-value][data-filter-type]");
  allDropdownItems.forEach((item) => {
    const filterType = item.getAttribute("data-filter-type");
    const filterValue = item.getAttribute("data-value");
    if (filterType && filterValue) {
      const count = countStoriesByFilter(filterType, filterValue);
      const countSpan = item.querySelectorAll("span")[1];
      if (countSpan) {
        countSpan.textContent = count;
      }
    }
  });
}
function animateVisibleCards() {
  const visibleCards = document.querySelectorAll(
    '.story-card[style*="display: block"], .story-card:not([style*="display: none"])'
  );
  visibleCards.forEach((card, index) => {
    if (!card.hasAttribute("data-ns-animate")) return;
    const duration = card.getAttribute("data-duration") ? parseFloat(card.getAttribute("data-duration")) : 0.6;
    const offset = card.getAttribute("data-offset") ? parseFloat(card.getAttribute("data-offset")) : 60;
    const direction = card.getAttribute("data-direction") || "down";
    const animationProps = {
      opacity: 0,
      filter: "blur(16px)",
      duration,
      delay: index * 0.1
    };
    if (direction === "down") {
      animationProps.y = offset;
    }
    gsap.from(card, animationProps);
  });
}
function filterStories() {
  const allCards = document.querySelectorAll(".story-card");
  const allFiltersAreDefault = currentFilters.industry === "all" && currentFilters.product === "all" && currentFilters.service === "all" && currentFilters.solution === "all";
  if (allFiltersAreDefault) {
    allCards.forEach((card) => {
      card.style.display = "block";
    });
    animateVisibleCards();
    return;
  }
  allCards.forEach((card) => {
    var _a;
    const industryMatch = currentFilters.industry !== "all" && ((_a = card.getAttribute("data-industry")) == null ? void 0 : _a.toLowerCase()) === currentFilters.industry.toLowerCase();
    const productMatch = currentFilters.product !== "all" && card.getAttribute("data-product") === currentFilters.product;
    const serviceMatch = currentFilters.service !== "all" && card.getAttribute("data-service") === currentFilters.service;
    const solutionMatch = currentFilters.solution !== "all" && card.getAttribute("data-solution") === currentFilters.solution;
    if (industryMatch || productMatch || serviceMatch || solutionMatch) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
  animateVisibleCards();
}
const dropdownButtons = document.querySelectorAll(".dropdown-button");
dropdownButtons.forEach((button) => {
  const dropdown = button.parentElement.querySelector(".customer-dropdown-menu");
  const dropdownItems = dropdown == null ? void 0 : dropdown.querySelectorAll("[data-value]");
  if (!button || !dropdown) return;
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains("active")) {
      closeDropdown(button, dropdown);
    } else {
      closeAllDropdownsExcept(dropdown);
      openDropdown(button, dropdown);
    }
  });
  if (dropdownItems) {
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const selectedText = item.querySelector("span").textContent;
        const filterType = item.getAttribute("data-filter-type");
        const filterValue = item.getAttribute("data-value");
        const buttonText = button.querySelector("span");
        if (buttonText) {
          buttonText.textContent = selectedText;
        }
        if (filterType && filterValue) {
          currentFilters.industry = "all";
          currentFilters.product = "all";
          currentFilters.service = "all";
          currentFilters.solution = "all";
          currentFilters[filterType] = filterValue;
          const allButtons = document.querySelectorAll(".dropdown-button");
          allButtons.forEach((btn) => {
            const btnName = btn.getAttribute("name");
            if (btnName !== filterType) {
              const btnText = btn.querySelector("span");
              if (btnText) {
                if (btnName === "industry") btnText.textContent = "All Industries";
                else if (btnName === "product") btnText.textContent = "All Products";
                else if (btnName === "service") btnText.textContent = "All Services";
                else if (btnName === "solution") btnText.textContent = "All Solutions";
              }
            }
          });
          const allDropdowns = document.querySelectorAll(".customer-dropdown-menu");
          allDropdowns.forEach((dd) => {
            const ddItems = dd.querySelectorAll("[data-value]");
            ddItems.forEach((ddItem) => {
              const itemFilterType = ddItem.getAttribute("data-filter-type");
              const itemValue = ddItem.getAttribute("data-value");
              ddItem.classList.remove("bg-white", "dark:bg-background-8");
              if (itemFilterType !== filterType && itemValue === "all") {
                ddItem.classList.add("bg-white", "dark:bg-background-8");
              }
            });
          });
        }
        dropdownItems.forEach((i) => {
          i.classList.remove("bg-white", "dark:bg-background-8");
        });
        item.classList.add("bg-white", "dark:bg-background-8");
        closeDropdown(button, dropdown);
        filterStories();
      });
    });
  }
});
document.addEventListener("click", (e) => {
  let clickedInsideAnyDropdown = false;
  const allButtons = document.querySelectorAll(".dropdown-button");
  allButtons.forEach((button) => {
    const dropdown = button.parentElement.querySelector(".customer-dropdown-menu");
    if (button && (button.contains(e.target) || (dropdown == null ? void 0 : dropdown.contains(e.target)))) {
      clickedInsideAnyDropdown = true;
    }
  });
  if (!clickedInsideAnyDropdown) {
    allButtons.forEach((button) => {
      const dropdown = button.parentElement.querySelector(".customer-dropdown-menu");
      if (button && dropdown) {
        closeDropdown(button, dropdown);
      }
    });
  }
});
updateDropdownCounts();
const glossaryAnimation = {
  init() {
    const glossaryFiltersButtons = document.querySelectorAll(
      ".glossary-filters-buttons-container button"
    );
    const glossaryCards = document.querySelectorAll(".glossary-card");
    if (glossaryFiltersButtons.length > 0 && glossaryCards.length > 0) {
      glossaryCards.forEach((card) => {
        card.style.display = "none";
      });
      let selectedButton = glossaryFiltersButtons[0];
      selectedButton.dataset.selected = "true";
      let selectedLetter = "a";
      const animateCards = (card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            filter: "blur(16px)"
          },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            delay: 0.3 + index * 0.1,
            duration: 0.6,
            ease: "power2.out"
          }
        );
      };
      const filterCards = (letter) => {
        const visibleCards = [];
        glossaryCards.forEach((card) => {
          if (letter && card.dataset.letter.toLowerCase() === letter.toLowerCase()) {
            card.style.display = "flex";
            visibleCards.push(card);
          } else {
            card.style.display = "none";
            if (typeof gsap !== "undefined") {
              gsap.set(card, { clearProps: "transform,opacity,filter" });
            }
          }
        });
        visibleCards.forEach((card, index) => {
          animateCards(card, index);
        });
      };
      filterCards(selectedLetter);
      glossaryFiltersButtons.forEach((button, index) => {
        if (index > 0) {
          button.dataset.selected = "false";
        }
        button.addEventListener("click", () => {
          const buttonLetter = button.textContent.trim().toLowerCase();
          if (button === selectedButton) {
            button.dataset.selected = "false";
            selectedButton = null;
            selectedLetter = null;
            glossaryCards.forEach((card, index2) => {
              card.style.display = "flex";
              animateCards(card, index2);
            });
          } else {
            if (selectedButton) {
              selectedButton.dataset.selected = "false";
            }
            button.dataset.selected = "true";
            selectedButton = button;
            selectedLetter = buttonLetter;
            filterCards(selectedLetter);
          }
        });
      });
    }
  }
};
window.addEventListener("DOMContentLoaded", () => {
  glossaryAnimation.init();
});
document.addEventListener("DOMContentLoaded", function() {
  if (typeof gsap === "undefined") {
    console.error("GSAP is not loaded.");
    return;
  }
  gsap.registerPlugin(MotionPathPlugin);
  const gradientAnimation = {
    init() {
      const paths = [
        "curve-path-1",
        "curve-path-2",
        "curve-path-3",
        "curve-path-4",
        "curve-path-5",
        "curve-path-6",
        "curve-path-7",
        "curve-path-8"
      ];
      paths.forEach((pathId, index) => {
        const path = document.getElementById(pathId);
        function interpolateColor(color1, color2, factor) {
          const r1 = parseInt(color1.slice(1, 3), 16);
          const g1 = parseInt(color1.slice(3, 5), 16);
          const b1 = parseInt(color1.slice(5, 7), 16);
          const r2 = parseInt(color2.slice(1, 3), 16);
          const g2 = parseInt(color2.slice(3, 5), 16);
          const b2 = parseInt(color2.slice(5, 7), 16);
          const r = Math.round(r1 + (r2 - r1) * factor);
          const g = Math.round(g1 + (g2 - g1) * factor);
          const b = Math.round(b1 + (b2 - b1) * factor);
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        }
        if (index === 0) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-1-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#83E7EE", "#F9EB57", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 1) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-2-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#F9EB57", "#83E7EE", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 2) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-3-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#83E7EE", "#F9EB57", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 3) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-4-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#83E7EE", "#F9EB57", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 4) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-5-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#F9EB57", "#83E7EE", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 5) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-6-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#83E7EE", "#F9EB57", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 6) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-7-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#F9EB57", "#83E7EE", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        } else if (index === 7) {
          const duration = gsap.utils.random(3, 6);
          const delay = gsap.utils.random(0, 2);
          for (let i = 1; i <= 60; i++) {
            const rect = document.getElementById(`rect-8-${i}`);
            if (path && rect) {
              const factor = (i - 1) / 59;
              const gradientColor = interpolateColor("#83E7EE", "#F9EB57", factor);
              rect.setAttribute("fill", gradientColor);
              gsap.to(rect, {
                motionPath: {
                  path,
                  align: path,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: false
                },
                duration,
                // Same duration for all
                ease: "power1.inOut",
                repeat: -1,
                delay: delay + i * 2e-3
                // Slight stagger to create continuous line
              });
            }
          }
        }
      });
    },
    // Method to pause all animations
    pause() {
      gsap.globalTimeline.pause();
    },
    // Method to resume all animations
    resume() {
      gsap.globalTimeline.resume();
    },
    // Method to restart all animations
    restart() {
      gsap.globalTimeline.restart();
    }
  };
  gradientAnimation.init();
  window.gradientAnimation = gradientAnimation;
});
const headerAnimation = {
  headerOne() {
    const header = document.querySelector(".header-one");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("scroll-header");
        } else {
          header.classList.remove("scroll-header");
        }
      });
    }
  },
  headerTwo() {
    const header = document.querySelector(".header-two");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 150) {
          header.style.transition = "all 0.5s ease-in-out";
          header.style.top = "20px";
          header.classList.add("header-two-scroll");
        } else {
          header.classList.remove("header-two-scroll");
          header.style.top = "50px";
        }
      });
    }
  },
  headerThree() {
    const header = document.querySelector(".header-three");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("header-three-scroll");
        } else {
          header.classList.remove("header-three-scroll");
        }
      });
    }
  },
  headerFour() {
    const header = document.querySelector(".header-four");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("header-four-scroll");
        } else {
          header.classList.remove("header-four-scroll");
        }
      });
    }
  },
  headerFive() {
    const header = document.querySelector(".header-five");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 25) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("header-five-scroll");
        } else {
          header.classList.remove("header-five-scroll");
        }
      });
    }
  },
  headerSix() {
    const header = document.querySelector(".header-six");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("header-six-scroll");
        } else {
          header.classList.remove("header-six-scroll");
        }
      });
    }
  },
  aiVoiceHeader() {
    const header = document.querySelector(".ai-voice-header");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("scroll-ai-voice-header");
        } else {
          header.classList.remove("scroll-ai-voice-header");
        }
      });
    }
  },
  financialManagementPlatformHeader() {
    const header = document.querySelector(".financial-management-platform-header");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          header.style.transition = "all 0.5s ease-in-out";
          header.classList.add("financial-management-platform-header-scroll");
        } else {
          header.classList.remove("financial-management-platform-header-scroll");
        }
      });
    }
  }
};
if (typeof window !== "undefined") {
  headerAnimation.headerOne();
  headerAnimation.headerTwo();
  headerAnimation.headerThree();
  headerAnimation.headerFour();
  headerAnimation.headerFive();
  headerAnimation.headerSix();
  headerAnimation.aiVoiceHeader();
  headerAnimation.financialManagementPlatformHeader();
}
document.addEventListener("DOMContentLoaded", function() {
  if (typeof InfiniteMarquee === "undefined") {
    return;
  }
  const animation = {
    infiniteLeft() {
      if (document.querySelector(".logos-marquee-container")) {
        new InfiniteMarquee({
          element: ".logos-marquee-container",
          speed: 4e4,
          smoothEdges: true,
          direction: "left",
          gap: "32px",
          duplicateCount: 1,
          mobileSettings: {
            direction: "top",
            speed: 5e4
          },
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    infiniteRight() {
      if (document.querySelector(".logos-right-marquee-container")) {
        new InfiniteMarquee({
          element: ".logos-right-marquee-container",
          speed: 4e4,
          smoothEdges: true,
          direction: "right",
          gap: "32px",
          duplicateCount: 1,
          mobileSettings: {
            direction: "right",
            speed: 5e4
          },
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    infiniteIconRight() {
      if (document.querySelector(".icon-right-marquee-container")) {
        new InfiniteMarquee({
          element: ".icon-right-marquee-container",
          speed: 2e3,
          smoothEdges: true,
          direction: "right",
          gap: "32px",
          duplicateCount: 1,
          mobileSettings: {
            direction: "right",
            speed: 5e4
          },
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    initHover() {
      if (document.querySelector(".cards-marquee-container")) {
        new InfiniteMarquee({
          element: ".cards-marquee-container",
          speed: 14e4,
          smoothEdges: true,
          direction: "left",
          gap: "32px",
          pauseOnHover: true,
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    initHoverRight() {
      if (document.querySelector(".cards-right-marquee-container")) {
        new InfiniteMarquee({
          element: ".cards-right-marquee-container",
          speed: 14e4,
          smoothEdges: true,
          direction: "right",
          gap: "32px",
          pauseOnHover: true,
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    infiniteTop() {
      if (document.querySelector(".top-marquee-container")) {
        new InfiniteMarquee({
          element: ".top-marquee-container",
          speed: 4e4,
          smoothEdges: true,
          direction: "top",
          gap: "32px",
          pauseOnHover: true,
          duplicateCount: 0,
          mobileSettings: {
            direction: "top",
            speed: 5e4
          },
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    infiniteBottom() {
      if (document.querySelector(".bottom-marquee-container")) {
        new InfiniteMarquee({
          element: ".bottom-marquee-container",
          speed: 4e4,
          smoothEdges: true,
          direction: "bottom",
          pauseOnHover: true,
          gap: "32px",
          duplicateCount: 0,
          mobileSettings: {
            direction: "bottom",
            speed: 5e4
          },
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    },
    initTopNavMarquee() {
      if (document.querySelector(".top-nav-marquee")) {
        new InfiniteMarquee({
          element: ".top-nav-marquee",
          speed: 7e4,
          smoothEdges: true,
          pauseOnHover: true,
          direction: "left",
          gap: "16px",
          duplicateCount: 2,
          mobileSettings: {
            direction: "left",
            speed: 5e4
          },
          on: {
            beforeInit: () => {
            },
            afterInit: () => {
            }
          }
        });
      }
    }
  };
  animation.infiniteLeft();
  animation.infiniteRight();
  animation.initHover();
  animation.initHoverRight();
  animation.infiniteTop();
  animation.infiniteBottom();
  animation.infiniteIconRight();
  animation.initTopNavMarquee();
});
class ModalAnimation {
  constructor() {
    this.modalAction = null;
    this.modalOverlay = null;
    this.modalCloseBtn = null;
    this.modalContent = null;
    this.isModalOpen = false;
    this.hasTriggeredByScroll = false;
    this.previouslyFocusedElement = null;
    this.animationConfig = {
      open: {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      },
      close: {
        opacity: 0,
        y: -50,
        duration: 0.2,
        ease: "power2.in"
      }
    };
  }
  init() {
    this.cacheElements();
    this.bindEvents();
    this.bindScrollTrigger();
  }
  cacheElements() {
    this.modalAction = document.querySelector(".modal-action");
    this.modalOverlay = document.querySelector(".modal-overlay");
    this.modalCloseBtn = document.querySelector(".modal-close-btn") || document.querySelector(".close-join-modal");
    this.modalContent = document.querySelector(".modal-content");
  }
  bindEvents() {
    var _a;
    (_a = this.modalAction) == null ? void 0 : _a.addEventListener("click", () => this.openModal());
    if (this.modalCloseBtn && !this.modalCloseBtn.hasAttribute("data-events-bound")) {
      this.modalCloseBtn.addEventListener("click", () => this.closeModal(true));
      this.modalCloseBtn.setAttribute("data-events-bound", "true");
    }
    if (this.modalOverlay && !this.modalOverlay.hasAttribute("data-events-bound")) {
      this.modalOverlay.addEventListener("click", (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal(false);
        }
      });
      this.modalOverlay.setAttribute("data-events-bound", "true");
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isModalOpen) {
        this.closeModal(false);
      }
    });
  }
  bindScrollTrigger() {
    const findJoinModal = () => {
      return Array.from(document.querySelectorAll(".modal-overlay")).find(
        (overlay) => overlay.querySelector(".close-join-modal") || overlay.querySelector("#join-modal-title")
      );
    };
    const joinModalOverlay = findJoinModal();
    if (!joinModalOverlay) return;
    const dismissed = window.localStorage.getItem("joinModalDismissed") === "true";
    if (dismissed) return;
    const tryTrigger = () => {
      if (this.hasTriggeredByScroll) return;
      const currentJoinModalOverlay = findJoinModal();
      if (!currentJoinModalOverlay) return;
      const joinModalContent = currentJoinModalOverlay.querySelector(".modal-content");
      if (!joinModalContent) return;
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      if (scrollPosition >= 800) {
        this.hasTriggeredByScroll = true;
        this.modalOverlay = currentJoinModalOverlay;
        this.modalContent = joinModalContent;
        this.modalCloseBtn = currentJoinModalOverlay.querySelector(".close-join-modal") || currentJoinModalOverlay.querySelector(".modal-close-btn");
        if (this.modalOverlay && !this.modalOverlay.hasAttribute("data-events-bound")) {
          this.modalOverlay.addEventListener("click", (e) => {
            if (e.target === this.modalOverlay) {
              this.closeModal(false);
            }
          });
          this.modalOverlay.setAttribute("data-events-bound", "true");
        }
        if (this.modalCloseBtn && !this.modalCloseBtn.hasAttribute("data-events-bound")) {
          this.modalCloseBtn.addEventListener("click", () => this.closeModal(true));
          this.modalCloseBtn.setAttribute("data-events-bound", "true");
        }
        this.openModal();
        window.removeEventListener("scroll", tryTrigger);
      }
    };
    window.addEventListener("scroll", tryTrigger, { passive: true });
    if (document.readyState === "complete" || document.readyState === "interactive") {
      tryTrigger();
    } else {
      document.addEventListener("DOMContentLoaded", tryTrigger, { once: true });
    }
  }
  async closeModal(persist = false) {
    if (!this.isModalOpen || !this.modalOverlay) return;
    this.isModalOpen = false;
    document.body.style.overflow = "auto";
    if (persist) {
      try {
        window.localStorage.setItem("joinModalDismissed", "true");
      } catch (_) {
      }
    }
    try {
      if (this.modalContent) {
        await gsap.to(this.modalContent, {
          ...this.animationConfig.close,
          onComplete: () => {
            this.modalOverlay.classList.remove("modal-open");
            this.modalOverlay.classList.add("modal-close");
            this.modalOverlay.setAttribute("aria-hidden", "true");
          }
        });
      } else {
        this.modalOverlay.classList.remove("modal-open");
        this.modalOverlay.classList.add("modal-close");
        this.modalOverlay.setAttribute("aria-hidden", "true");
      }
    } catch (error) {
      console.error("Error closing modal:", error);
    }
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === "function") {
      this.previouslyFocusedElement.focus();
    }
  }
  openModal() {
    if (this.isModalOpen || !this.modalOverlay) return;
    this.isModalOpen = true;
    document.body.style.overflow = "hidden";
    this.modalOverlay.classList.remove("modal-close");
    this.modalOverlay.classList.add("modal-open");
    this.modalOverlay.setAttribute("aria-hidden", "false");
    if (this.modalContent) {
      gsap.set(this.modalContent, {
        opacity: 0,
        y: -50
      });
      gsap.to(this.modalContent, this.animationConfig.open);
      this.previouslyFocusedElement = document.activeElement;
      this.modalContent.style.outline = "none";
      this.modalContent.style.boxShadow = "none";
      this.modalContent.setAttribute("tabindex", "-1");
      this.modalContent.focus();
    }
  }
}
const modalAnimation = new ModalAnimation();
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      modalAnimation.init();
    });
  } else {
    modalAnimation.init();
  }
}
const sidebarAnimation = {
  elements: null,
  init() {
    try {
      this.cacheElements();
      this.bindEvents();
    } catch (error) {
      console.error("Sidebar animation initialization failed:", error);
    }
  },
  cacheElements() {
    this.elements = {
      navHamburger: document.querySelector(".nav-hamburger"),
      navHamburgerClose: document.querySelector(".nav-hamburger-close"),
      sidebar: document.querySelector(".sidebar"),
      subMenu: document.querySelectorAll(".sub-menu")
    };
  },
  bindEvents() {
    const { navHamburger, navHamburgerClose, subMenu } = this.elements;
    if (navHamburger) {
      navHamburger.addEventListener("click", () => {
        this.elements.sidebar.classList.add("show-sidebar");
        document.body.classList.add("overflow-hidden");
      });
    }
    if (navHamburgerClose) {
      navHamburgerClose.addEventListener("click", () => {
        this.elements.sidebar.classList.remove("show-sidebar");
        document.body.classList.remove("overflow-hidden");
      });
    }
    subMenu.forEach((menu) => {
      menu.addEventListener("click", () => {
        menu.classList.toggle("active-menu");
        menu.nextElementSibling.classList.toggle("hidden");
        menu.children[1].classList.toggle("rotate-90");
        subMenu.forEach((otherMenu) => {
          if (otherMenu !== menu) {
            otherMenu.nextElementSibling.classList.add("hidden");
            otherMenu.children[1].classList.remove("rotate-90");
            otherMenu.classList.remove("active-menu");
          }
        });
      });
    });
  }
};
if (typeof window !== "undefined") {
  sidebarAnimation.init();
}
const testimonials = [
  {
    name: "Jessica Lee",
    position: "Head of customer Success",
    image: "images/ns-avatar-9.png",
    quote: "The investment insights are clear, easy to understand and follow. I love the automation and feel like I'm making real progress every day."
  },
  {
    name: "Mark Thompson",
    position: "Marketing Director",
    image: "./images/ns-avatar-11.png",
    quote: "This platform helps our team move faster, stay aligned, and reduce errors. It's a powerful tool that boosts productivity all around."
  },
  {
    name: "Amina Yusuf",
    position: "Product Manager",
    image: "./images/ns-avatar-10.png",
    quote: "Our planning is finally clear and consistent. I feel more confident in how my team executes tasks and reaches project goals on time."
  },
  {
    name: "Leo Chen",
    position: "Founder, ScaleX",
    image: "./images/ns-avatar-9.png",
    quote: "The design is clean and the interface is effortless to use. It saves time, improves clarity, and just makes everything run smoother."
  },
  {
    name: "John Doe",
    position: "CEO",
    image: "./images/ns-avatar-8.png",
    quote: "A great platform for managing projects with clarity and speed. It's intuitive, efficient, and keeps everyone on the same page easily."
  }
];
const sliderAnimation = {
  init() {
    let currentIndex2 = 0;
    const avatarImgs = document.querySelectorAll(".testimonial-avatar");
    const quoteEl = document.querySelector("#testimonial-quote h3");
    const nameEl = document.querySelector("#testimonial-info h4");
    const positionEl = document.querySelector("#testimonial-info p");
    if (avatarImgs.length < 5 || !quoteEl || !nameEl || !positionEl) {
      return;
    }
    function updateAvatarImages() {
      for (let i = 0; i < 5; i++) {
        const avatarIndex = (currentIndex2 + i - 2 + testimonials.length) % testimonials.length;
        const testimonial = testimonials[avatarIndex];
        const imgEl = avatarImgs[i];
        if (!imgEl) continue;
        imgEl.src = testimonial.image;
        imgEl.alt = `${testimonial.name}'s avatar`;
        gsap.fromTo(
          imgEl,
          {
            opacity: 1,
            scale: 1.1
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            delay: i * 0.05,
            ease: "power2.out"
          }
        );
      }
    }
    function updateTextContent() {
      const t = testimonials[currentIndex2];
      if (quoteEl) {
        gsap.to(quoteEl, {
          opacity: 0,
          y: -10,
          duration: 0.2,
          onComplete: () => {
            quoteEl.textContent = `"${t.quote}"`;
            gsap.to(quoteEl, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      }
      if (nameEl) {
        gsap.to(nameEl, {
          opacity: 0,
          y: 5,
          duration: 0.2,
          onComplete: () => {
            nameEl.textContent = t.name;
            gsap.to(nameEl, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      }
      if (positionEl) {
        gsap.to(positionEl, {
          opacity: 0,
          y: 5,
          duration: 0.2,
          onComplete: () => {
            positionEl.textContent = t.position;
            gsap.to(positionEl, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      }
    }
    function updateTestimonial() {
      updateAvatarImages();
      updateTextContent();
    }
    updateTestimonial();
    setInterval(() => {
      currentIndex2 = (currentIndex2 + 1) % testimonials.length;
      updateTestimonial();
    }, 3e3);
  }
};
if (typeof window !== "undefined") {
  sliderAnimation.init();
}
const svgDraw = {
  init() {
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    const selectors = ["#svg-one", "#svg-two", "#svg-three"];
    const existingSelectors = selectors.filter((selector) => {
      const element = document.querySelector(selector);
      return element !== null;
    });
    if (existingSelectors.length === 0) {
      return;
    }
    gsap.set(existingSelectors.join(", "), { visibility: "visible" });
    existingSelectors.forEach((selector) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: selector,
          start: "top 80%"
        }
      });
      tl.from(selector, {
        duration: 1,
        drawSVG: 1,
        delay: 0.5,
        ease: "power2.out"
      });
    });
  }
};
window.addEventListener("DOMContentLoaded", () => {
  svgDraw.init();
});
function initReviewsSwiper() {
  const reviewsSwiper = new Swiper(".reviews-swiper", {
    slidesPerView: 1,
    padding: 10,
    spaceBetween: 70,
    loop: true,
    centeredSlides: true,
    speed: 1500,
    effect: "slide",
    autoplay: {
      delay: 3e3,
      disableOnInteraction: false
    },
    navigation: {
      nextEl: ".reviews-next",
      prevEl: ".reviews-prev"
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 15,
        centeredSlides: true
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 32,
        centeredSlides: true
      }
    },
    on: {
      slideChange: function() {
        const slides = this.slides;
        slides.forEach((slide, index) => {
          if (index === this.activeIndex) {
            slide.style.transition = "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          } else {
            slide.style.transition = "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          }
        });
      },
      slideChangeTransitionStart: function() {
        const activeSlide = this.slides[this.activeIndex];
        if (activeSlide) {
          const elements = activeSlide.querySelectorAll(
            ".review-text, .review-name, .review-title, .avatar-ring"
          );
          elements.forEach((el) => {
            el.style.animation = "none";
            el.offsetHeight;
            el.style.animation = null;
          });
        }
      }
    }
  });
  const singleCardReviewsSwiper = new Swiper(".single-card-reviews-swiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    centeredSlides: true,
    speed: 1100,
    allowTouchMove: false,
    autoplay: {
      delay: 4e3,
      disableOnInteraction: true
    },
    navigation: {
      nextEl: ".single-card-reviews-next",
      prevEl: ".single-card-reviews-prev"
    },
    on: {
      init: function() {
        const activeSlide = this.slides[this.activeIndex];
        if (activeSlide) {
          activeSlide.style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          activeSlide.style.transform = "scale(1)";
          activeSlide.style.opacity = "1";
          activeSlide.style.filter = "blur(0)";
        }
      },
      slideChange: function() {
        const slides = this.slides;
        slides.forEach((slide) => {
          slide.style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          slide.style.transform = "scale(0.8)";
          slide.style.opacity = "0.3";
          slide.style.filter = "blur(3px)";
        });
      },
      slideChangeTransitionStart: function() {
        const activeSlide = this.slides[this.activeIndex];
        if (activeSlide) {
          activeSlide.style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          activeSlide.style.transform = "scale(1)";
          activeSlide.style.opacity = "1";
          activeSlide.style.filter = "blur(0)";
        }
      }
    }
  });
  const reviewsFadeInSwiper = new Swiper(".reviews-fade-in-swiper", {
    // modules: [Navigation, Pagination, Autoplay, EffectFade],
    slidesPerView: 1,
    spaceBetween: 70,
    loop: true,
    effect: "fade",
    fadeEffect: {
      crossFade: true
    },
    speed: 1e3,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    navigation: {
      nextEl: ".reviews-fade-in-next",
      prevEl: ".reviews-fade-in-prev"
    },
    pagination: {
      el: ".reviews-fade-in-pagination",
      clickable: true,
      dynamicBullets: true
    },
    on: {
      init: function() {
        const style = document.createElement("style");
        style.textContent = `
              .reviews-fade-in-swiper .swiper-slide {
                transition: opacity 0.8s ease-out, transform 0.8s ease-out, filter 0.8s ease-out;
                opacity: 0;
                transform: scale(0.6);
                filter: blur(7px);
              }
              .reviews-fade-in-swiper .swiper-slide-active {
                opacity: 1;
                transform: scale(1);
                filter: blur(0);
              }
              .reviews-fade-in-swiper .swiper-slide-prev,
              .reviews-fade-in-swiper .swiper-slide-next {
                opacity: 0;
                transform: scale(0.6);
                filter: blur(7px);
              }
              .reviews-fade-in-swiper .swiper-slide .review-text,
              .reviews-fade-in-swiper .swiper-slide .review-name,
              .reviews-fade-in-swiper .swiper-slide .review-title,
              .reviews-fade-in-swiper .swiper-slide .avatar-ring {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
              }
              .reviews-fade-in-swiper .swiper-slide-active .review-text,
              .reviews-fade-in-swiper .swiper-slide-active .review-name,
              .reviews-fade-in-swiper .swiper-slide-active .review-title,
              .reviews-fade-in-swiper .swiper-slide-active .avatar-ring {
                opacity: 1;
                transform: translateY(0);
              }
            `;
        document.head.appendChild(style);
      },
      slideChangeTransitionStart: function() {
        const slides = this.slides;
        slides.forEach((slide) => {
          const elements = slide.querySelectorAll(
            ".review-text, .review-name, .review-title, .avatar-ring"
          );
          elements.forEach((el) => {
            el.style.animation = "none";
            el.style.transition = "none";
            el.style.opacity = "0";
            el.style.transform = "translateY(30px)";
          });
        });
      },
      slideChangeTransitionEnd: function() {
        const activeSlide = this.slides[this.activeIndex];
        if (activeSlide) {
          const elements = activeSlide.querySelectorAll(
            ".review-text, .review-name, .review-title, .avatar-ring"
          );
          elements.forEach((el) => {
            el.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
          });
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, index * 100);
          });
        }
      }
    }
  });
  const customStyles = document.createElement("style");
  customStyles.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(customStyles);
  const blogArticleSwiper = new Swiper(".blog-article-swiper", {
    slidesPerView: 1,
    spaceBetween: 40,
    loop: true,
    effect: "slide",
    speed: 1e3,
    autoplay: {
      delay: 4e3,
      disableOnInteraction: false
    },
    pagination: {
      el: ".pagination-bullets",
      clickable: true,
      type: "bullets"
    },
    on: {
      slideChange: function() {
        const slides = this.slides;
        slides.forEach((slide, index) => {
          if (index === this.activeIndex) {
            slide.style.transition = "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          } else {
            slide.style.transition = "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          }
        });
      }
    }
  });
  const socialProofSwiper = new Swiper(".social-proof-swiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    centeredSlides: true,
    speed: 1100,
    allowTouchMove: false,
    autoplay: {
      delay: 3e3,
      disableOnInteraction: true
    },
    navigation: {
      nextEl: ".social-proof-next",
      prevEl: ".social-proof-prev"
    },
    on: {
      init: function() {
        setupSocialProofAvatars(this);
        updateActiveAvatar(this.realIndex);
      },
      slideChange: function() {
        updateActiveAvatar(this.realIndex);
      }
    }
  });
  function setupSocialProofAvatars(swiperInstance) {
    const avatars = document.querySelectorAll(".social-proof-avatar");
    avatars.forEach((avatar) => {
      avatar.addEventListener("click", function() {
        const slideIndex = parseInt(this.getAttribute("data-slide-index"));
        if (swiperInstance.realIndex === slideIndex) {
          return;
        }
        if (swiperInstance.autoplay.running) {
          swiperInstance.autoplay.stop();
        }
        swiperInstance.slideToLoop(slideIndex);
        setTimeout(() => {
          if (swiperInstance.params.autoplay && !swiperInstance.autoplay.running) {
            swiperInstance.autoplay.start();
          }
        }, swiperInstance.params.speed);
      });
    });
  }
  function updateActiveAvatar(activeIndex) {
    const avatars = document.querySelectorAll(".social-proof-avatar");
    avatars.forEach((avatar, index) => {
      if (index === activeIndex) {
        avatar.classList.add("active");
      } else {
        avatar.classList.remove("active");
      }
    });
  }
  const financialManagementPlatformSwiper = new Swiper(".financial-management-platform-swiper", {
    breakpoints: {
      425: {
        slidesPerView: 1
      },
      768: {
        slidesPerView: 2
      },
      1024: {
        slidesPerView: 3
      },
      1290: {
        slidesPerView: 4
      }
    },
    spaceBetween: 4,
    initialSlide: 4,
    loop: true,
    loopAdditionalSlides: 2,
    speed: 1100,
    allowTouchMove: true,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false
    },
    pagination: {
      el: ".financial-management-platform-pagination",
      clickable: true,
      type: "bullets",
      dynamicBullets: false
    },
    on: {
      init: function() {
        const slides = this.slides;
        const activeIndex = this.activeIndex;
        const slidesPerView = 4;
        slides.forEach((slide, index) => {
          slide.style.transition = "opacity 0.6s ease-out, filter 0.6s ease-out";
          let offset = index - activeIndex;
          if (offset < 0) offset += slides.length;
          if (offset >= 0 && offset < slidesPerView) {
            slide.style.opacity = "1";
            slide.style.filter = "blur(0px)";
          } else {
            slide.style.opacity = "0.3";
            slide.style.filter = "blur(30px)";
          }
        });
      },
      slideChangeTransitionStart: function() {
        const slides = this.slides;
        const activeIndex = this.activeIndex;
        const slidesPerView = 4;
        slides.forEach((slide, index) => {
          slide.style.transition = "opacity 0.6s ease-out, filter 0.6s ease-out";
          let offset = index - activeIndex;
          if (offset < 0) offset += slides.length;
          if (offset >= 0 && offset < slidesPerView) {
            slide.style.opacity = "1";
            slide.style.filter = "blur(0px)";
          } else {
            slide.style.opacity = "0.3";
            slide.style.filter = "blur(30px)";
          }
        });
      }
    }
  });
  return {
    reviewsSwiper,
    singleCardReviewsSwiper,
    reviewsFadeInSwiper,
    blogArticleSwiper,
    socialProofSwiper,
    financialManagementPlatformSwiper
  };
}
initReviewsSwiper();
let currentIndex = 0;
let initialized = false;
function init() {
  if (initialized) return;
  const tabBarBtns = document.querySelectorAll("[data-tab-button]");
  const mobileTabBtns = document.querySelectorAll("[data-mobile-tab-button]");
  const tabContent = document.querySelectorAll("[data-tab-content]");
  const activeTabBar = document.querySelector("[data-active-tab-bar]");
  if (!tabBarBtns.length && !mobileTabBtns.length || !tabContent.length) {
    return;
  }
  if (tabBarBtns.length) {
    tabBarBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => switchTab(index));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          switchTab(index);
        }
      });
    });
    switchTab(0);
  }
  if (mobileTabBtns.length) {
    mobileTabBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => switchMobileTab(index));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          switchMobileTab(index);
        }
      });
    });
    switchMobileTab(0);
  }
  if (activeTabBar && tabBarBtns.length) {
    window.addEventListener("resize", () => {
      if (tabBarBtns[currentIndex]) {
        updateActiveTabBar(tabBarBtns[currentIndex], activeTabBar);
      }
    });
  }
  initialized = true;
}
function switchTab(index) {
  const tabBarBtns = document.querySelectorAll("[data-tab-button]");
  const tabContent = document.querySelectorAll("[data-tab-content]");
  const activeTabBar = document.querySelector("[data-active-tab-bar]");
  if (index < 0 || index >= tabBarBtns.length) return;
  currentIndex = index;
  tabBarBtns.forEach((btn, i) => {
    btn.dataset.state = i === index ? "selected" : "";
    btn.setAttribute("aria-selected", i === index);
  });
  if (activeTabBar) {
    updateActiveTabBar(tabBarBtns[index], activeTabBar);
  }
  switchContent(index, tabContent);
}
function switchMobileTab(index) {
  const mobileTabBtns = document.querySelectorAll("[data-mobile-tab-button]");
  const tabContent = document.querySelectorAll("[data-tab-content]");
  if (index < 0 || index >= mobileTabBtns.length) return;
  currentIndex = index;
  mobileTabBtns.forEach((btn, i) => {
    if (i === index) {
      btn.dataset.mobileActive = "true";
    } else {
      delete btn.dataset.mobileActive;
    }
    btn.setAttribute("aria-selected", i === index);
  });
  switchContent(index, tabContent);
}
function updateActiveTabBar(activeButton, activeTabBar) {
  if (!activeTabBar || !activeButton) return;
  const tabBar = activeTabBar.closest("[data-tab-bar]");
  if (!tabBar) return;
  const left = activeButton.getBoundingClientRect().left - tabBar.getBoundingClientRect().left;
  const width = activeButton.offsetWidth;
  activeTabBar.style.left = `${left}px`;
  activeTabBar.style.width = `${width}px`;
}
function switchContent(targetIndex, tabContent) {
  tabContent.forEach((content, index) => {
    if (targetIndex === index) {
      content.style.display = "block";
      content.setAttribute("aria-hidden", "false");
      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          content,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3, delay: 0.05, ease: "power2.out" }
        );
      }
      requestAnimationFrame(() => {
        const accordion = content.querySelector(".accordion");
        if (accordion && globalThis.accordionAnimation) {
          globalThis.accordionAnimation.initAccordionGroup(accordion);
        }
      });
    } else {
      content.style.display = "none";
      content.setAttribute("aria-hidden", "true");
    }
  });
}
if (globalThis.window !== void 0) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
let tabFilterInitialized = false;
const tabFilter = {
  init() {
    if (tabFilterInitialized) return;
    const tabBarBtns = document.querySelectorAll("[data-tab-button]");
    const activeTabBar = document.querySelector("[data-active-tab-bar]");
    const mobileTabBtns = document.querySelectorAll("[data-mobile-tab-button]");
    const articles = document.querySelectorAll("[data-filter-item]");
    if (!tabBarBtns.length && !mobileTabBtns.length || !articles.length) {
      return;
    }
    let currentIndex2 = 0;
    const getButtonCategory = (btn) => {
      const text = btn.textContent.trim().toLowerCase();
      return text === "ai software" ? "ai software" : text;
    };
    const updateTabBar = (button) => {
      if (!activeTabBar || !button) return;
      const tabBar = activeTabBar.closest("[data-tab-bar]");
      if (!tabBar) return;
      const left = button.getBoundingClientRect().left - tabBar.getBoundingClientRect().left;
      activeTabBar.style.left = `${left}px`;
      activeTabBar.style.width = `${button.offsetWidth}px`;
    };
    const filterArticles = (category) => {
      const filtered = [];
      const hidden = [];
      articles.forEach((container) => {
        var _a;
        const containerCategory = ((_a = container.dataset.filterCategory) == null ? void 0 : _a.toLowerCase()) || "";
        const show = category === "all" || containerCategory === category;
        if (show) {
          filtered.push(container);
        } else {
          hidden.push(container);
        }
      });
      return { filtered, hidden };
    };
    const animateFilter = async (filtered, hidden) => {
      const allContainers = [...filtered, ...hidden];
      const canAnimate = typeof gsap !== "undefined" && gsap && typeof gsap.to === "function";
      if (!canAnimate) {
        hidden.forEach((container) => {
          container.style.display = "none";
          container.setAttribute("aria-hidden", "true");
        });
        filtered.forEach((container) => {
          container.style.display = "block";
          container.setAttribute("aria-hidden", "false");
          container.style.opacity = "1";
          container.style.transform = "none";
          container.style.filter = "none";
        });
        return;
      }
      const fadeOutTweens = allContainers.map(
        (container) => gsap.to(container, {
          opacity: 0,
          scale: 0.95,
          filter: "blur(4px)",
          duration: 0.3,
          ease: "power2.inOut"
        })
      );
      await Promise.all(fadeOutTweens.map((tween) => tween.then()));
      hidden.forEach((container) => {
        container.style.display = "none";
        container.setAttribute("aria-hidden", "true");
      });
      filtered.forEach((container) => {
        container.style.display = "block";
        container.setAttribute("aria-hidden", "false");
        container.style.opacity = "0";
        container.style.transform = "scale(0.95)";
        container.style.filter = "blur(4px)";
      });
      const fadeInTweens = filtered.map(
        (container, index) => gsap.to(container, {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          delay: index * 0.1,
          ease: "power2.out"
        })
      );
      await Promise.all(fadeInTweens.map((tween) => tween.then()));
    };
    const switchFilter = async (index, buttons) => {
      if (index < 0 || index >= buttons.length) return;
      currentIndex2 = index;
      const category = getButtonCategory(buttons[index]);
      if ("tabButton" in buttons[0].dataset) {
        buttons.forEach((btn, i) => {
          btn.dataset.state = i === index ? "selected" : "";
        });
        updateTabBar(buttons[index]);
      }
      if ("mobileTabButton" in buttons[0].dataset) {
        buttons.forEach((btn, i) => {
          if (i === index) {
            btn.dataset.mobileActive = "true";
          } else {
            delete btn.dataset.mobileActive;
          }
        });
      }
      const { filtered, hidden } = filterArticles(category);
      await animateFilter(filtered, hidden);
      const filterEvent = new CustomEvent("blogFiltered", {
        detail: {
          category,
          filteredCount: filtered.length,
          totalCount: articles.length
        }
      });
      document.dispatchEvent(filterEvent);
    };
    if (tabBarBtns.length) {
      tabBarBtns.forEach((btn, index) => {
        btn.addEventListener("click", () => switchFilter(index, tabBarBtns));
      });
      switchFilter(0, tabBarBtns);
      setTimeout(() => updateTabBar(tabBarBtns[0]), 0);
    }
    if (mobileTabBtns.length) {
      mobileTabBtns.forEach((btn, index) => {
        btn.addEventListener("click", () => switchFilter(index, mobileTabBtns));
      });
      switchFilter(0, mobileTabBtns);
    }
    if (activeTabBar && tabBarBtns.length) {
      globalThis.window.addEventListener("resize", () => {
        if (tabBarBtns[currentIndex2]) {
          updateTabBar(tabBarBtns[currentIndex2]);
        }
      });
    }
    const filterCSS = `
      [data-filter-item] {
        will-change: opacity, transform, filter;
        transform-origin: center;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      
      [data-filter-item][aria-hidden="true"] {
        opacity: 0;
        transform: scale(0.95);
        filter: blur(4px);
        pointer-events: none;
      }
      
      [data-filter-item][aria-hidden="false"] {
        opacity: 1;
        transform: scale(1);
        filter: blur(0px);
        pointer-events: auto;
      }
      
      /* Smooth transitions for tab bar */
      [data-tab-button] {
        transition: color 0.3s ease, background-color 0.3s ease;
      }
      
      /* Mobile filter button styles */
      [data-mobile-tab-button] {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        overflow: hidden;
      }
      
      [data-mobile-tab-button]:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      /* Active tab bar transition */
      [data-active-tab-bar] {
        transition: left 0.3s ease, width 0.3s ease;
      }
      
      /* Reduce motion for users who prefer it */
      @media (prefers-reduced-motion: reduce) {
        [data-filter-item],
        [data-mobile-tab-button],
        [data-active-tab-bar] {
          transition: none;
          transform: none !important;
        }
      }
    `;
    if (!document.querySelector("#tab-filter-styles")) {
      const style = document.createElement("style");
      style.id = "tab-filter-styles";
      style.textContent = filterCSS;
      document.head.appendChild(style);
    }
    tabFilterInitialized = true;
  }
};
if (globalThis.window) {
  const init2 = () => {
    if ((document.querySelector("[data-tab-button]") || document.querySelector("[data-mobile-tab-button]")) && !tabFilterInitialized) {
      tabFilter.init();
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init2);
  } else {
    init2();
  }
}
const triggerRevealAnimation = (element) => {
  if (!element || typeof gsap === "undefined") return;
  gsap.killTweensOf(element);
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 50
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "linear"
    }
  );
};
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll("[data-tab-content]");
  const activeIndicator = document.querySelector("[data-active-tab-indicator]");
  const tabContents = document.querySelectorAll("[data-tab-contents-container] [data-tab-content]");
  const tabContainer = document.querySelector("[data-tab-items-container]");
  if (!tabButtons.length || !activeIndicator || !tabContents.length) {
    return;
  }
  let selectedButton = document.querySelector("[data-selected]");
  if (!selectedButton && tabButtons.length > 0) {
    selectedButton = tabButtons[0];
    selectedButton.dataset.selected = "";
  }
  const updateIndicator = (button) => {
    const containerRect = tabContainer.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const left = buttonRect.left - containerRect.left;
    const top = buttonRect.top - containerRect.top;
    const width = buttonRect.width;
    const height = buttonRect.height;
    activeIndicator.style.left = `${left}px`;
    activeIndicator.style.top = `${top}px`;
    activeIndicator.style.width = `${width}px`;
    activeIndicator.style.height = `${height}px`;
  };
  const showContent = (contentName) => {
    tabContents.forEach((content) => {
      if (content.dataset.tabContent === contentName) {
        content.classList.remove("hidden");
        content.classList.add("flex");
        content.setAttribute("aria-hidden", "false");
        triggerRevealAnimation(content);
      } else {
        content.classList.add("hidden");
        content.classList.remove("flex");
        content.setAttribute("aria-hidden", "true");
      }
    });
  };
  const updateButtonStates = (activeButton) => {
    tabButtons.forEach((button) => {
      if (button === activeButton) {
        button.dataset.selected = "";
        button.setAttribute("aria-selected", "true");
        button.setAttribute("tabindex", "0");
        button.classList.remove("text-secondary/60");
        button.classList.add("text-white");
      } else {
        delete button.dataset.selected;
        button.setAttribute("aria-selected", "false");
        button.setAttribute("tabindex", "-1");
        button.classList.remove("text-white");
        button.classList.add("text-secondary/60");
      }
    });
  };
  if (selectedButton) {
    const contentName = selectedButton.dataset.tabContent;
    updateIndicator(selectedButton);
    showContent(contentName);
    updateButtonStates(selectedButton);
  }
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const contentName = button.dataset.tabContent;
      updateIndicator(button);
      showContent(contentName);
      updateButtonStates(button);
    });
  });
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentSelected = document.querySelector("[data-selected]");
      if (currentSelected) {
        updateIndicator(currentSelected);
      }
    }, 150);
  });
});
const typewriterAnimation = {
  init() {
    if (typeof gsap === "undefined" || typeof SplitText === "undefined") {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const typewriterElement = document.querySelector(".typewriter-text");
    const container = document.querySelector(".typewriter-text-container");
    if (!typewriterElement || !container) {
      return;
    }
    const split = new SplitText(typewriterElement, {
      type: "chars",
      tag: "span"
    });
    gsap.set(split.chars, { opacity: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        once: true
      }
    });
    const typingDuration = 3;
    const charDelay = typingDuration / split.chars.length;
    split.chars.forEach((char, index) => {
      tl.to(char, { opacity: 1, duration: 0.01 }, index * charDelay);
    });
  }
};
document.addEventListener("DOMContentLoaded", () => {
  typewriterAnimation.init();
});
const voiceWaveform = {
  init() {
    const svgContainer = document.querySelector("#voice-waveform");
    if (!svgContainer) {
      return;
    }
    const voiceBars = svgContainer.querySelectorAll(".voice-bar");
    if (voiceBars.length === 0) {
      return;
    }
    const originalWidths = Array.from(voiceBars).map((rect) => {
      const width = Number.parseFloat(rect.getAttribute("width")) || 0;
      return width;
    });
    voiceBars.forEach((singleBar, index) => {
      const originalWidth = originalWidths[index];
      if (originalWidth <= 1) {
        return;
      }
      const isHighBar = !singleBar.hasAttribute("fill-opacity");
      const minHeight = isHighBar ? originalWidth * 0.2 : originalWidth * 0.1;
      const maxHeight = originalWidth;
      const position = index / voiceBars.length;
      const sineOffset = Math.sin(position * Math.PI * 4) * 0.1;
      const baseDelay = index * 0.012;
      const delay = baseDelay + sineOffset;
      const duration = isHighBar ? 0.4 + Math.random() * 0.25 : 0.6 + Math.random() * 0.3;
      const initialHeight = minHeight + (maxHeight - minHeight) * (0.3 + Math.random() * 0.2);
      gsap.set(singleBar, {
        attr: { width: initialHeight }
      });
      const tl = gsap.timeline({
        repeat: -1,
        delay
      });
      tl.to(singleBar, {
        attr: { width: maxHeight },
        duration,
        ease: "sine.inOut"
      }).to(singleBar, {
        attr: { width: minHeight },
        duration,
        ease: "linear"
      });
    });
  }
};
document.addEventListener("DOMContentLoaded", function() {
  if (typeof gsap === "undefined") {
    console.error("GSAP is not loaded.");
    return;
  }
  voiceWaveform.init();
});
document.addEventListener("DOMContentLoaded", function() {
  if (typeof gsap === "undefined") {
    return;
  }
  const waveSvg = document.getElementById("voice-wave-svg");
  if (!waveSvg) {
    return;
  }
  const wavePaths = waveSvg.querySelectorAll(".wave-path");
  if (wavePaths.length === 0) {
    return;
  }
  wavePaths.forEach((path, index) => {
    const amplitude = 4 + index * 0.5;
    const duration = 1.2 + index * 0.1;
    const delay = index * 0.15;
    gsap.to(path, {
      y: -amplitude,
      duration,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay
    });
  });
});
const buttonV3 = {
  init(root = document) {
    const buttonWrappers = root.querySelectorAll("[data-button-v3]");
    buttonWrappers.forEach((buttonWrapper) => {
      if (buttonWrapper.dataset.v3Bound) return;
      buttonWrapper.dataset.v3Bound = "true";
      const iconWrapper = buttonWrapper.querySelector("[data-button-v3-icon]");
      const buttonText = buttonWrapper.querySelector("[data-button-v3-text]");
      if (!iconWrapper || !buttonText) return;
      const calculateDistance = () => {
        const wrapperWidth = Math.ceil(buttonWrapper.clientWidth);
        const iconWidth = iconWrapper.clientWidth;
        const iconTranslateXDistance = wrapperWidth - (iconWidth + 9);
        const textTranslateXDistance = iconWidth;
        return { iconTranslateXDistance, textTranslateXDistance };
      };
      const onEnter = () => {
        const { iconTranslateXDistance, textTranslateXDistance } = calculateDistance();
        iconWrapper.style.transform = `translateX(${iconTranslateXDistance}px)`;
        buttonText.style.transform = `translateX(-${textTranslateXDistance}px)`;
      };
      const onLeave = () => {
        iconWrapper.style.transform = "translateX(0)";
        buttonText.style.transform = "translateX(0)";
      };
      buttonWrapper.addEventListener("mouseenter", onEnter);
      buttonWrapper.addEventListener("mouseleave", onLeave);
    });
  }
};
globalThis.addEventListener("DOMContentLoaded", () => {
  buttonV3.init();
});
function dividerExpand(divider) {
  gsap.to(divider, {
    scrollTrigger: {
      trigger: divider,
      start: "top 100%",
      end: "top 50%",
      scrub: false,
      toggleActions: "play none none none"
    },
    width: "100%",
    duration: 1,
    delay: 0.7,
    ease: "power2.out"
  });
}
const commonAnimation = {
  init() {
    const divider = document.querySelector(".divider");
    const footerDivider = document.querySelector(".footer-divider");
    const progressContainer = document.querySelector(".progress-container");
    const progressLine = document.querySelectorAll(".progress-line");
    const scrollExpand = document.querySelector(".scroll-expand");
    const stepLine = document.querySelectorAll(".step-line");
    const splitTextTeamTitle = document.querySelector(".split-text-team-title");
    const heroPerspective = document.querySelector(".hero-perspective");
    const heroLines = document.querySelectorAll("[data-hero-line]");
    const featureCard1 = document.querySelector(".feature-card-1");
    const featureCard2 = document.querySelector(".feature-card-2");
    const featureCard3 = document.querySelector(".feature-card-3");
    const monthCards = document.querySelectorAll(".month-card");
    const monthLinks = document.querySelectorAll(".month-link");
    if (divider) {
      dividerExpand(divider);
    }
    if (footerDivider) {
      dividerExpand(footerDivider);
    }
    if (progressLine.length > 0) {
      gsap.set(progressLine, { width: "0%" });
      const progressTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: progressContainer,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });
      progressLine.forEach((line, index) => {
        progressTimeline.to(
          line,
          {
            width: "100%",
            duration: 2,
            ease: "power2.inOut"
          },
          index * 2
          // Each animation starts after the previous one completes (2 seconds duration)
        );
      });
    }
    if (scrollExpand) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        gsap.set(scrollExpand, { minWidth: "auto" });
      } else {
        gsap.set(scrollExpand, { minWidth: "500px" });
        ScrollTrigger.create({
          trigger: scrollExpand,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => {
            gsap.to(scrollExpand, {
              minWidth: "950px",
              duration: 0.5,
              ease: "power2.out"
            });
          },
          onEnterBack: () => {
            gsap.to(scrollExpand, {
              minWidth: "950px",
              duration: 0.5,
              ease: "power2.out"
            });
          },
          onLeaveBack: () => {
            gsap.to(scrollExpand, {
              minWidth: "500px",
              duration: 0.5,
              ease: "power2.out"
            });
          }
        });
      }
    }
    if (stepLine.length > 0) {
      gsap.set(stepLine, { height: "0px" });
      stepLine.forEach((line, index) => {
        gsap.to(line, {
          height: "380px",
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: line,
            start: "top 75%",
            end: "top 15%",
            toggleActions: "play none none reverse",
            // Add a small stagger delay for sequential feel
            onEnter: () => {
              gsap.delayedCall(index * 0.15, () => {
                gsap.to(line, {
                  height: "380px",
                  duration: 1.5,
                  ease: "power3.out"
                });
              });
            }
          }
        });
      });
    }
    if (splitTextTeamTitle) {
      gsap.registerPlugin(SplitText);
      const splitType = splitTextTeamTitle.getAttribute("data-split-type") || "chars";
      let split = SplitText.create(".split-text-team-title", { type: splitType });
      gsap.from(split[splitType], {
        scrollTrigger: {
          trigger: splitTextTeamTitle,
          start: "top 80%",
          end: "top 20%",
          scrub: true
        },
        opacity: 0.1,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out"
      });
    }
    if (heroPerspective) {
      gsap.set(heroPerspective, {
        opacity: 0,
        filter: "blur(20px)",
        transform: "perspective(1200px) scale(0.896871) rotateX(14.4381deg)"
      });
      ScrollTrigger.create({
        trigger: heroPerspective,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(heroPerspective, {
            opacity: 1,
            filter: "blur(0px)",
            transform: "perspective(1200px) scale(1) rotateX(0deg)",
            duration: 0.8,
            delay: 0.7,
            ease: "power2.out"
          });
        }
      });
    }
    if (heroLines.length > 0) {
      heroLines.forEach((line) => {
        gsap.to(line, {
          height: "100%",
          duration: 0.8,
          delay: 0.7,
          ease: "power2.out"
        });
      });
    }
    if (featureCard1) {
      gsap.from(featureCard1, {
        x: 100,
        rotation: 0,
        duration: 0.8,
        delay: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featureCard1,
          start: "top 90%",
          end: "bottom 20%",
          scrub: 2
        }
      });
    }
    if (featureCard2) {
      gsap.from(featureCard2, {
        rotation: 10,
        duration: 0.8,
        delay: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featureCard1,
          start: "top 90%",
          end: "bottom 20%",
          scrub: 2
        }
      });
    }
    if (featureCard3) {
      gsap.from(featureCard3, {
        x: -100,
        rotation: 0,
        duration: 0.8,
        delay: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featureCard1,
          start: "top 90%",
          end: "bottom 20%",
          scrub: 2
        }
      });
    }
    if (monthCards.length > 0 && monthLinks.length > 0) {
      let updateActiveLink2 = function() {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          let activeCard = null;
          let minDistance = Infinity;
          const viewportTop = window.scrollY || window.pageYOffset;
          const viewportBottom = viewportTop + window.innerHeight;
          const viewportCenter = viewportTop + window.innerHeight * 0.3;
          monthCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const cardTop = rect.top + viewportTop;
            const cardBottom = cardTop + rect.height;
            const cardCenter = cardTop + rect.height / 2;
            if (cardTop <= viewportBottom && cardBottom >= viewportTop) {
              const distance = Math.abs(cardCenter - viewportCenter);
              if (distance < minDistance) {
                minDistance = distance;
                activeCard = card;
              }
            }
          });
          const newActiveCardId = activeCard ? activeCard.getAttribute("data-month") : null;
          if (newActiveCardId !== activeCardId) {
            activeCardId = newActiveCardId;
            monthLinks.forEach((link) => {
              const monthId = link.getAttribute("data-month-link");
              if (monthId === activeCardId) {
                link.classList.add("bg-background-12", "dark:!bg-background-6");
              } else {
                link.classList.remove("bg-background-12", "dark:!bg-background-6");
              }
            });
          }
          rafId = null;
        });
      };
      var updateActiveLink = updateActiveLink2;
      let activeCardId = null;
      let rafId = null;
      monthLinks.forEach((link) => {
        link.addEventListener("click", function(e) {
          e.preventDefault();
          const targetId = this.getAttribute("data-month-link");
          const targetCard = document.getElementById(targetId);
          if (targetCard) {
            const offsetTop = targetCard.offsetTop - 200;
            window.scrollTo({
              top: offsetTop,
              behavior: "smooth"
            });
          }
        });
      });
      if ("IntersectionObserver" in window) {
        const observerOptions = {
          root: null,
          rootMargin: "-20% 0px -60% 0px",
          threshold: [0, 0.1, 0.3, 0.5, 0.7, 1]
        };
        const observer = new IntersectionObserver((entries) => {
          updateActiveLink2();
        }, observerOptions);
        monthCards.forEach((card) => {
          observer.observe(card);
        });
      } else {
        let scrollTimeout;
        window.addEventListener(
          "scroll",
          function() {
            if (scrollTimeout) {
              clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(updateActiveLink2, 10);
          },
          { passive: true }
        );
      }
      updateActiveLink2();
    }
    const stepCards = document.querySelectorAll(".step-card");
    const stepNumbers = document.querySelectorAll(".step-number");
    if (stepCards.length > 0 && stepNumbers.length > 0) {
      const observerOptions = {
        root: null,
        rootMargin: "-400px 0px -50% 0px",
        threshold: [0, 0.1, 0.5, 1]
      };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepNumber = entry.target.getAttribute("data-step");
            const correspondingNumber = document.querySelector(
              `.step-number[data-step-number="${stepNumber}"]`
            );
            stepNumbers.forEach((num) => {
              num.classList.remove("bg-ns-linen", "text-accent");
              num.classList.add("bg-ns-ivory", "text-secondary/40");
            });
            if (correspondingNumber) {
              correspondingNumber.classList.remove("bg-ns-ivory", "text-secondary/40");
              correspondingNumber.classList.add("bg-ns-linen", "text-accent");
            }
          }
        });
      }, observerOptions);
      stepCards.forEach((card) => {
        observer.observe(card);
      });
      stepNumbers.forEach((button) => {
        button.addEventListener("click", function() {
          const stepNumber = this.getAttribute("data-step-number");
          const targetCard = document.getElementById(`step-${stepNumber}`);
          if (targetCard) {
            if (window.lenis) {
              window.lenis.scrollTo(`#step-${stepNumber}`, {
                offset: -156,
                // Account for sticky header offset
                duration: 1.5,
                easing: (t) => 1 - Math.pow(1 - t, 3)
              });
            } else {
              const targetPosition = targetCard.getBoundingClientRect().top + window.pageYOffset - 156;
              window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
              });
            }
          }
        });
      });
    }
  },
  // Month cards and links handler for ai-voice-generator-changelog (uses bg-ns-ivory for active)
  initAiVoiceGeneratorChangelog() {
    const monthCards = document.querySelectorAll(".ai-voice-month-card");
    const monthLinks = document.querySelectorAll(".ai-voice-month-link");
    if (monthCards.length > 0 && monthLinks.length > 0) {
      let updateActiveLink2 = function() {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          let activeCard = null;
          let minDistance = Infinity;
          const viewportTop = globalThis.window.scrollY || globalThis.window.pageYOffset;
          const viewportBottom = viewportTop + globalThis.window.innerHeight;
          const viewportCenter = viewportTop + globalThis.window.innerHeight * 0.3;
          monthCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const cardTop = rect.top + viewportTop;
            const cardBottom = cardTop + rect.height;
            const cardCenter = cardTop + rect.height / 2;
            if (cardTop <= viewportBottom && cardBottom >= viewportTop) {
              const distance = Math.abs(cardCenter - viewportCenter);
              if (distance < minDistance) {
                minDistance = distance;
                activeCard = card;
              }
            }
          });
          const newActiveCardId = activeCard ? activeCard.dataset.month : null;
          if (newActiveCardId !== activeCardId) {
            activeCardId = newActiveCardId;
            monthLinks.forEach((link) => {
              const monthId = link.dataset.monthLink;
              if (monthId === activeCardId) {
                link.classList.add("bg-ns-ivory");
              } else {
                link.classList.remove("bg-ns-ivory");
              }
            });
          }
          rafId = null;
        });
      };
      var updateActiveLink = updateActiveLink2;
      let activeCardId = null;
      let rafId = null;
      monthLinks.forEach((link) => {
        link.addEventListener("click", function(e) {
          e.preventDefault();
          const targetId = this.dataset.monthLink;
          const targetCard = document.getElementById(targetId);
          if (targetCard) {
            const offsetTop = targetCard.offsetTop - 200;
            globalThis.window.scrollTo({
              top: offsetTop,
              behavior: "smooth"
            });
          }
        });
      });
      if ("IntersectionObserver" in globalThis.window) {
        const observerOptions = {
          root: null,
          rootMargin: "-20% 0px -60% 0px",
          threshold: [0, 0.1, 0.3, 0.5, 0.7, 1]
        };
        const observer = new IntersectionObserver((entries) => {
          updateActiveLink2();
        }, observerOptions);
        monthCards.forEach((card) => {
          observer.observe(card);
        });
      } else {
        let scrollTimeout;
        globalThis.window.addEventListener(
          "scroll",
          function() {
            if (scrollTimeout) {
              clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(updateActiveLink2, 10);
          },
          { passive: true }
        );
      }
      updateActiveLink2();
    }
  }
};
if (globalThis.window !== void 0) {
  commonAnimation.init();
  const initChangelog = () => {
    if (document.querySelector(".ai-voice-month-card") && document.querySelector(".ai-voice-month-link")) {
      commonAnimation.initAiVoiceGeneratorChangelog();
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChangelog);
  } else {
    initChangelog();
  }
}
class MobileMenuAccordion {
  constructor(options = {}) {
    this.defaultOpenMenu = options.defaultOpenMenu || "company";
    this.toggleButtons = null;
    this.submenus = null;
    this.arrows = null;
    this.init();
  }
  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }
  bindEvents() {
    this.toggleButtons = document.querySelectorAll(".mobile-menu-toggle[data-menu]");
    if (this.toggleButtons.length === 0) {
      return;
    }
    this.submenus = document.querySelectorAll(".mobile-submenu[data-submenu]");
    this.arrows = document.querySelectorAll(".mobile-menu-toggle .menu-arrow");
    this.setDefaultState();
    this.toggleButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const menuId = button.getAttribute("data-menu");
        this.toggleMenu(menuId);
      });
    });
  }
  setDefaultState() {
    this.submenus.forEach((submenu) => {
      submenu.classList.add("hidden");
      submenu.classList.remove("block");
    });
    this.arrows.forEach((arrow) => {
      arrow.classList.remove("rotate-90");
    });
    if (this.defaultOpenMenu) {
      const defaultSubmenu = document.querySelector(
        `.mobile-submenu[data-submenu="${this.defaultOpenMenu}"]`
      );
      const defaultButton = document.querySelector(
        `.mobile-menu-toggle[data-menu="${this.defaultOpenMenu}"]`
      );
      const defaultArrow = defaultButton == null ? void 0 : defaultButton.querySelector(".menu-arrow");
      if (defaultSubmenu) {
        defaultSubmenu.classList.remove("hidden");
        defaultSubmenu.classList.add("block");
      }
      if (defaultArrow) {
        defaultArrow.classList.add("rotate-90");
      }
    }
  }
  toggleMenu(menuId) {
    const submenu = document.querySelector(`.mobile-submenu[data-submenu="${menuId}"]`);
    const button = document.querySelector(`.mobile-menu-toggle[data-menu="${menuId}"]`);
    const arrow = button == null ? void 0 : button.querySelector(".menu-arrow");
    if (!submenu || !button) {
      return;
    }
    const isCurrentlyOpen = submenu.classList.contains("block") && !submenu.classList.contains("hidden");
    this.closeAllMenus();
    if (isCurrentlyOpen) {
      submenu.classList.add("hidden");
      submenu.classList.remove("block");
      if (arrow) {
        arrow.classList.remove("rotate-90");
      }
    } else {
      submenu.classList.remove("hidden");
      submenu.classList.add("block");
      if (arrow) {
        arrow.classList.add("rotate-90");
      }
    }
  }
  closeAllMenus() {
    this.submenus.forEach((submenu) => {
      submenu.classList.add("hidden");
      submenu.classList.remove("block");
    });
    this.arrows.forEach((arrow) => {
      arrow.classList.remove("rotate-90");
    });
  }
  openMenu(menuId) {
    const submenu = document.querySelector(`.mobile-submenu[data-submenu="${menuId}"]`);
    const button = document.querySelector(`.mobile-menu-toggle[data-menu="${menuId}"]`);
    const arrow = button == null ? void 0 : button.querySelector(".menu-arrow");
    if (submenu && button) {
      this.closeAllMenus();
      submenu.classList.remove("hidden");
      submenu.classList.add("block");
      if (arrow) {
        arrow.classList.add("rotate-90");
      }
    }
  }
  closeMenu(menuId) {
    const submenu = document.querySelector(`.mobile-submenu[data-submenu="${menuId}"]`);
    const button = document.querySelector(`.mobile-menu-toggle[data-menu="${menuId}"]`);
    const arrow = button == null ? void 0 : button.querySelector(".menu-arrow");
    if (submenu && button) {
      submenu.classList.add("hidden");
      submenu.classList.remove("block");
      if (arrow) {
        arrow.classList.remove("rotate-90");
      }
    }
  }
  reinit() {
    this.bindEvents();
  }
  setDefaultOpenMenu(menuId) {
    this.defaultOpenMenu = menuId;
    this.setDefaultState();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuExists = document.querySelector(".mobile-menu-toggle[data-menu]");
  if (mobileMenuExists) {
    window.mobileMenuAccordion = new MobileMenuAccordion({
      defaultOpenMenu: "company"
    });
  }
});
class NavigationMenu {
  constructor() {
    this.activeMenu = null;
    this.menuTimeout = null;
    this.isMouseInHeader = false;
    this.isMouseInMenu = false;
    this.init();
  }
  init() {
    this.bindEvents();
  }
  bindEvents() {
    const navItems = document.querySelectorAll(".nav-item[data-menu]");
    navItems.forEach((item) => {
      const menuId = item.getAttribute("data-menu");
      const menu = document.getElementById(menuId);
      if (!menu) return;
      item.addEventListener("mouseenter", (e) => {
        this.showMenu(item, menu);
      });
      item.addEventListener("mouseleave", (e) => {
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !menu.contains(relatedTarget)) {
          this.scheduleHideMenu();
        }
      });
      menu.addEventListener("mouseenter", (e) => {
        this.cancelHideMenu();
        this.showMenu(item, menu);
      });
      menu.addEventListener("mouseleave", (e) => {
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !item.contains(relatedTarget)) {
          this.scheduleHideMenu();
        }
      });
    });
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (target && typeof target.closest === "function") {
        if (!target.closest(".nav-item") && !target.closest(".mega-menu, .dropdown-menu")) {
          this.hideAllMenus();
        }
      }
    });
    const header = document.querySelector("header");
    if (header) {
      header.addEventListener("mouseenter", () => {
        this.isMouseInHeader = true;
        this.cancelHideMenu();
      });
      header.addEventListener("mouseleave", (e) => {
        this.isMouseInHeader = false;
        const relatedTarget = e.relatedTarget;
        const isMovingToMenu = relatedTarget && (relatedTarget.closest(".mega-menu") || relatedTarget.closest(".dropdown-menu"));
        if (!isMovingToMenu) {
          this.scheduleHideMenu();
        }
      });
    }
    document.addEventListener(
      "mouseenter",
      (e) => {
        const target = e.target;
        if (target && typeof target.closest === "function") {
          if (target.closest(".mega-menu, .dropdown-menu, .mega-menu-bridge, .dropdown-menu-bridge")) {
            this.isMouseInMenu = true;
            this.cancelHideMenu();
          }
        }
      },
      true
    );
    document.addEventListener(
      "mouseleave",
      (e) => {
        const target = e.target;
        if (target && typeof target.closest === "function") {
          if (target.closest(".mega-menu, .dropdown-menu, .mega-menu-bridge, .dropdown-menu-bridge")) {
            this.isMouseInMenu = false;
            const relatedTarget = e.relatedTarget;
            const isMovingToHeader = relatedTarget && typeof relatedTarget.closest === "function" && (relatedTarget.closest("header") || relatedTarget.closest(".mega-menu") || relatedTarget.closest(".dropdown-menu") || relatedTarget.closest(".mega-menu-bridge") || relatedTarget.closest(".dropdown-menu-bridge"));
            if (!isMovingToHeader) {
              this.scheduleHideMenu();
            }
          }
        }
      },
      true
    );
    document.addEventListener("mouseleave", () => {
      this.hideAllMenus();
    });
  }
  showMenu(navItem, menu) {
    this.cancelHideMenu();
    this.hideAllMenus();
    this.activeMenu = menu;
    navItem.classList.add("active");
    menu.classList.add("active");
    navItem.classList.add("menu-active");
    const bridge = navItem.querySelector(".mega-menu-bridge, .dropdown-menu-bridge");
    if (bridge) {
      bridge.style.opacity = "1";
      bridge.style.pointerEvents = "auto";
    }
    this.dispatchMenuEvent("menu:show", { navItem, menu });
  }
  hideMenu(menu) {
    if (!menu) return;
    const navItem = document.querySelector(`[data-menu="${menu.id}"]`);
    menu.classList.remove("active");
    if (navItem) {
      navItem.classList.remove("active", "menu-active");
      const bridge = navItem.querySelector(".mega-menu-bridge, .dropdown-menu-bridge");
      if (bridge) {
        bridge.style.opacity = "0";
        bridge.style.pointerEvents = "none";
      }
    }
    if (this.activeMenu === menu) {
      this.activeMenu = null;
    }
    this.dispatchMenuEvent("menu:hide", { navItem, menu });
  }
  hideAllMenus() {
    const allMenus = document.querySelectorAll(".mega-menu, .dropdown-menu");
    const allNavItems = document.querySelectorAll(".nav-item[data-menu]");
    allMenus.forEach((menu) => this.hideMenu(menu));
    allNavItems.forEach((item) => {
      item.classList.remove("active", "menu-active");
    });
    this.activeMenu = null;
  }
  scheduleHideMenu() {
    this.cancelHideMenu();
    this.menuTimeout = setTimeout(() => {
      if (!this.isMouseInHeader && !this.isMouseInMenu) {
        this.hideAllMenus();
      }
    }, 200);
  }
  cancelHideMenu() {
    if (this.menuTimeout) {
      clearTimeout(this.menuTimeout);
      this.menuTimeout = null;
    }
  }
  dispatchMenuEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
  // Public methods for external control
  showMenuById(menuId) {
    const navItem = document.querySelector(`[data-menu="${menuId}"]`);
    const menu = document.getElementById(menuId);
    if (navItem && menu) {
      this.showMenu(navItem, menu);
    }
  }
  hideMenuById(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
      this.hideMenu(menu);
    }
  }
  toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu && menu.classList.contains("active")) {
      this.hideMenu(menu);
    } else {
      this.showMenuById(menuId);
    }
  }
  // Debug method to check current state
  getDebugInfo() {
    return {
      activeMenu: this.activeMenu ? this.activeMenu.id : null,
      isMouseInHeader: this.isMouseInHeader,
      isMouseInMenu: this.isMouseInMenu,
      hasTimeout: !!this.menuTimeout
    };
  }
}
document.addEventListener("DOMContentLoaded", () => {
  window.navigationMenu = new NavigationMenu();
});
const parallaxEffect = {
  init() {
    const scene = document.getElementById("scene");
    if (scene != null) {
      initializeParallaxEffect();
    }
    function initializeParallaxEffect() {
      if (!scene) return;
      freezeParallaxElements(scene);
      if (document.readyState === "complete") {
        startParallaxAfterLoad();
      } else {
        window.addEventListener("load", startParallaxAfterLoad);
      }
    }
    function freezeParallaxElements(scene2) {
      const parallaxElements = scene2.querySelectorAll(".parallax-effect");
      parallaxElements.forEach((element) => {
        element.style.willChange = "transform";
        element.style.transform = "translate3d(0px, 0px, 0)";
        element.style.transition = "none";
        element.classList.add("parallax-frozen");
      });
    }
    function startParallaxAfterLoad() {
      waitForImagesToLoad(scene, () => {
        setTimeout(() => {
          unfreezeAndStartParallax(scene);
        }, 300);
      });
    }
    function unfreezeAndStartParallax(scene2) {
      const parallaxElements = scene2.querySelectorAll(".parallax-effect");
      parallaxElements.forEach((element) => {
        element.classList.remove("parallax-frozen");
        element.style.transition = "transform 0.3s ease-out";
      });
      setupParallaxAnimation(scene2);
    }
    function waitForImagesToLoad(scene2, onComplete) {
      scene2.querySelectorAll(".parallax-effect");
      const parallaxImages = scene2.querySelectorAll(".parallax-effect img");
      if (parallaxImages.length === 0) {
        onComplete();
        return;
      }
      let loadedCount = 0;
      const totalImages = parallaxImages.length;
      const checkCompletion = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          onComplete();
        }
      };
      parallaxImages.forEach((img) => {
        if (img.complete) {
          checkCompletion();
        } else {
          img.addEventListener("load", checkCompletion);
          img.addEventListener("error", checkCompletion);
        }
      });
    }
    function setupParallaxAnimation(scene2) {
      const parallaxElements = scene2.querySelectorAll(".parallax-effect");
      const elementConfigs = createElementConfigs(parallaxElements);
      let isAnimating = false;
      let mouseX = scene2.offsetWidth / 2;
      let mouseY = scene2.offsetHeight / 2;
      initializeElements(elementConfigs);
      updateParallaxPositions(elementConfigs, mouseX, mouseY, scene2);
      const throttledMouseHandler = createThrottledHandler((event) => {
        mouseX = event.pageX;
        mouseY = event.pageY;
        if (!isAnimating) {
          requestAnimationFrame(() => {
            updateParallaxPositions(elementConfigs, mouseX, mouseY, scene2);
            isAnimating = false;
          });
          isAnimating = true;
        }
      });
      scene2.addEventListener("mousemove", throttledMouseHandler, {
        passive: true
      });
      setupPerformanceOptimization(scene2, elementConfigs);
    }
    function createElementConfigs(elements) {
      return Array.from(elements).map((element) => ({
        element,
        depth: parseFloat(element.getAttribute("data-parallax-value")) || 1,
        directionX: parseFloat(element.getAttribute("data-data-parallax-x")) || 1,
        directionY: parseFloat(element.getAttribute("data-data-parallax-y")) || 1,
        movementScale: 25
        // Reduced from 30 for smoother movement
      }));
    }
    function initializeElements(elementConfigs) {
      elementConfigs.forEach(({ element }) => {
        element.style.willChange = "transform";
        element.style.transform = "translateZ(0)";
      });
    }
    function updateParallaxPositions(elementConfigs, mouseX, mouseY, scene2) {
      const centerX = scene2.offsetWidth / 2;
      const centerY = scene2.offsetHeight / 2;
      const relativeX = (mouseX - centerX) / centerX;
      const relativeY = (mouseY - centerY) / centerY;
      elementConfigs.forEach(({ element, depth, directionX, directionY, movementScale }) => {
        if (!element.classList.contains("parallax-frozen")) {
          const moveX = relativeX * depth * directionX * movementScale;
          const moveY = relativeY * depth * directionY * movementScale;
          element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        }
      });
    }
    function createThrottledHandler(handler) {
      let timeoutId = null;
      return (event) => {
        if (timeoutId) return;
        timeoutId = setTimeout(() => {
          handler(event);
          timeoutId = null;
        }, 16);
      };
    }
    function setupPerformanceOptimization(scene2, elementConfigs) {
      let resetTimeout;
      scene2.addEventListener("mouseleave", () => {
        clearTimeout(resetTimeout);
        resetTimeout = setTimeout(() => {
          elementConfigs.forEach(({ element }) => {
            element.style.willChange = "auto";
          });
        }, 1e3);
      });
    }
  }
};
if (typeof window !== "undefined") {
  parallaxEffect.init();
}
const priceSwitcher = {
  // Store DOM elements
  elements: null,
  // Initialize the price switcher
  init() {
    try {
      this.getElements();
      this.addEventListeners();
      this.updatePrices();
    } catch (error) {
      console.error("Price switcher initialization failed:", error);
    }
  },
  // Get all the DOM elements we need
  getElements() {
    this.elements = {
      toggle: document.getElementById("priceCheck"),
      monthlyPrices: document.getElementsByClassName("price-month"),
      yearlyPrices: document.getElementsByClassName("price-year")
    };
  },
  // Update which prices are shown based on toggle state
  updatePrices() {
    const { toggle, monthlyPrices, yearlyPrices } = this.elements;
    if (!toggle) return;
    for (let i = 0; i < monthlyPrices.length; i++) {
      const monthly = monthlyPrices[i];
      const yearly = yearlyPrices[i];
      if (toggle.checked) {
        monthly.style.display = "none";
        yearly.style.display = "block";
      } else {
        monthly.style.display = "block";
        yearly.style.display = "none";
      }
    }
  },
  // Add click event to the toggle
  addEventListeners() {
    const { toggle } = this.elements;
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      this.updatePrices();
    });
  }
};
if (typeof window !== "undefined") {
  priceSwitcher.init();
}
const progressAnimation = {
  init() {
    const items = document.querySelectorAll("[data-progress-item]");
    items.forEach((item, index) => {
      const value = parseInt(item.getAttribute("data-progress-value"), 10) || 0;
      const bar = item.querySelector("[data-progress-bar]");
      const text = item.querySelector("[data-progress-text]");
      const duration = item.getAttribute("data-progress-duration") || 1.5;
      if (!bar || !text) return;
      gsap.set(bar, { width: "0%", opacity: 0.8 });
      gsap.to(bar, {
        width: `${value}%`,
        opacity: 1,
        duration,
        delay: 0.3 + index * 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: item,
          start: "top 90%",
          end: "bottom 15%",
          scrub: false
        }
      });
      gsap.set(text, { opacity: 0 });
      gsap.to(text, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.3 + index * 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 90%",
          end: "bottom 15%",
          scrub: false
        }
      });
      const counter = { val: 0 };
      gsap.to(counter, {
        val: value,
        duration: 2.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 90%",
          end: "bottom 15%",
          scrub: false
        },
        onUpdate: () => {
          text.textContent = `${Math.floor(counter.val)}%`;
        }
      });
    });
  }
};
if (typeof window !== "undefined") {
  progressAnimation.init();
}
const initRevealElements = () => {
  window.initRevealElements = initRevealElements;
  const elements = document.querySelectorAll("[data-ns-animate]");
  const Springer = window.Springer.default;
  elements.forEach((elem) => {
    const duration = elem.getAttribute("data-duration") ? parseFloat(elem.getAttribute("data-duration")) : 0.6;
    const delay = elem.getAttribute("data-delay") ? parseFloat(elem.getAttribute("data-delay")) : 0;
    const offset = elem.getAttribute("data-offset") ? parseFloat(elem.getAttribute("data-offset")) : 60;
    const instant = elem.hasAttribute("data-instant") && elem.getAttribute("data-instant") !== "false";
    const start = elem.getAttribute("data-start") || "top 90%";
    const end = elem.getAttribute("data-end") || "top 50%";
    const direction = elem.getAttribute("data-direction") || "down";
    const useSpring = elem.hasAttribute("data-spring");
    const spring = useSpring ? Springer(0.2, 0.8) : null;
    const rotation = elem.getAttribute("data-rotation") ? parseFloat(elem.getAttribute("data-rotation")) : 0;
    const animationType = elem.getAttribute("data-animation-type") || "from";
    elem.style.opacity = "1";
    elem.style.filter = "blur(0)";
    let animationProps;
    if (animationType === "to") {
      animationProps = {
        opacity: 1,
        filter: "blur(0)",
        duration,
        delay,
        ease: useSpring ? spring : "power2.out"
      };
      if (rotation !== 0) {
        animationProps.rotation = rotation;
      }
    } else {
      animationProps = {
        opacity: 0,
        filter: "blur(16px)",
        duration,
        delay,
        ease: useSpring ? spring : "power2.out"
      };
      if (rotation !== 0) {
        animationProps.rotation = rotation;
      }
    }
    if (!instant) {
      animationProps.scrollTrigger = {
        trigger: elem,
        start,
        end,
        scrub: false
      };
    }
    switch (direction) {
      case "left":
        animationProps.x = -offset;
        break;
      case "right":
        animationProps.x = offset;
        break;
      case "down":
        animationProps.y = offset;
        break;
      case "up":
      default:
        animationProps.y = -offset;
        break;
    }
    if (animationType === "to") {
      gsap.to(elem, animationProps);
    } else {
      gsap.from(elem, animationProps);
    }
  });
};
document.addEventListener("DOMContentLoaded", () => {
  initRevealElements();
});
let lenis;
const smoothScrolling = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768 || "ontouchstart" in window;
  if (!isMobile) {
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true
    });
    lenis.on("scroll", () => ScrollTrigger.update());
    gsap.ticker.add((time) => {
      lenis.raf(time * 1e3);
    });
    gsap.ticker.lagSmoothing(0);
  }
  window.lenis = lenis;
};
const resetTocItems = (sidebarList) => {
  const allListItems = sidebarList.querySelectorAll("li");
  allListItems.forEach((item) => {
    const icon = item.querySelector("span:last-child");
    const text = item.querySelector("span:first-child, a span");
    if (icon) icon.classList.add("invisible");
    if (text) {
      text.classList.remove("font-medium", "text-secondary", "dark:text-accent");
      text.classList.add("font-normal", "text-secondary/60", "dark:text-accent/60");
    }
  });
};
const activateTocItem = (item) => {
  const icon = item.querySelector("span:last-child");
  const text = item.querySelector("span:first-child, a span");
  if (icon) icon.classList.remove("invisible");
  if (text) {
    text.classList.remove("font-normal", "text-secondary/60", "dark:text-accent/60");
    text.classList.add("font-medium", "text-secondary", "dark:text-accent");
  }
};
const handleTocItemClick = (clickedItem, sidebarList) => {
  resetTocItems(sidebarList);
  activateTocItem(clickedItem);
};
const lenisSmoothScrollLinks = () => {
  const lenisTargetElements = document.querySelectorAll(".lenis-scroll-to");
  const sidebarList = document.querySelector(".table-of-contents .table-of-list");
  lenisTargetElements.forEach((ele) => {
    ele.addEventListener("click", function(e) {
      e.preventDefault();
      const target = ele.getAttribute("href");
      if (sidebarList) {
        const clickedItem = ele.closest("li");
        if (clickedItem) {
          handleTocItemClick(clickedItem, sidebarList);
        }
      }
      if (target) {
        if (lenis) {
          lenis.scrollTo(target, {
            offset: -100,
            duration: 1.7,
            easing: (t) => 1 - Math.pow(1 - t, 3)
          });
        } else {
          const targetElement = document.querySelector(target);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
            setTimeout(() => {
              window.scrollBy(0, -100);
            }, 100);
          }
        }
      }
    });
  });
};
const handleTocListClicks = () => {
  const sidebarList = document.querySelector(".table-of-contents .table-of-list");
  if (!sidebarList) return;
  const listItems = sidebarList.querySelectorAll("li");
  listItems.forEach((item) => {
    if (item.querySelector(".lenis-scroll-to")) {
      return;
    }
    item.addEventListener("click", function() {
      handleTocItemClick(item, sidebarList);
    });
  });
};
document.addEventListener("DOMContentLoaded", () => {
  smoothScrolling();
  lenisSmoothScrollLinks();
  handleTocListClicks();
});
const TOP_NAV_CONFIG = {
  expireDays: 30,
  prefix: "top-nav-",
  suffix: "-hidden"
};
const navbar = document.querySelector(".has-top-nav");
const Cookie = {
  set(name, value, days = TOP_NAV_CONFIG.expireDays) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1e3);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },
  get(name) {
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
    return match ? match.split("=")[1] : null;
  },
  remove(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }
};
const TopNav = {
  // Get a unique ID for each nav bar
  getId(nav) {
    return nav.getAttribute("accesskey") || nav.id || "default";
  },
  // Build cookie name
  cookieName(id) {
    return `${TOP_NAV_CONFIG.prefix}${id}${TOP_NAV_CONFIG.suffix}`;
  },
  // Check if nav should be hidden based on cookie
  isHidden(id) {
    return Cookie.get(this.cookieName(id)) === "true";
  },
  // Hide navigation and save state
  hide(nav) {
    const id = this.getId(nav);
    nav.classList.add("hidden");
    navbar.classList.add("is-cookie-false");
    navbar.classList.remove("is-cookie-true");
    navbar.style.transition = "all 0.5s ease-in-out";
    nav.classList.remove("visible");
    Cookie.set(this.cookieName(id), "true");
  },
  // Show navigation and clear state
  show(nav) {
    const id = this.getId(nav);
    nav.classList.add("visible");
    nav.classList.remove("hidden");
    navbar.classList.add("is-cookie-true");
    navbar.classList.remove("is-cookie-false");
    navbar.style.transition = "all 0.5s ease-in-out";
    Cookie.remove(this.cookieName(id));
  },
  // Initialize nav visibility based on saved cookies
  initVisibility() {
    const navs = document.querySelectorAll(".top-nav");
    navs.forEach((nav) => {
      const id = this.getId(nav);
      if (this.isHidden(id)) {
        nav.classList.add("hidden");
        nav.classList.remove("visible");
        navbar.classList.add("is-cookie-false");
        navbar.classList.remove("is-cookie-true");
        navbar.style.transition = "all 0.5s ease-in-out";
      } else {
        nav.classList.add("visible");
        nav.classList.remove("hidden");
        navbar.classList.add("is-cookie-true");
        navbar.classList.remove("is-cookie-false");
        navbar.style.transition = "all 0.5s ease-in-out";
      }
    });
  },
  // Setup close button listeners
  initCloseButtons() {
    const buttons = document.querySelectorAll(".close-top-nav");
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const nav = btn.closest(".top-nav");
        if (nav) this.hide(nav);
        else console.warn("  No parent .top-nav found for button");
      });
    });
  },
  // Initialize everything
  init() {
    this.initVisibility();
    this.initCloseButtons();
  }
};
document.addEventListener("DOMContentLoaded", () => TopNav.init());
document.addEventListener("DOMContentLoaded", function() {
  const numberObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const number = parseInt(element.getAttribute("data-number"));
          const speed = parseInt(element.getAttribute("data-speed")) || 800;
          const interval = parseInt(element.getAttribute("data-interval")) || 150;
          const rooms = parseInt(element.getAttribute("data-rooms")) || 2;
          const dataSpace = element.getAttribute("data-height-space");
          if (!element.classList.contains("animated")) {
            element.classList.add("animated");
            NumberAnimation(element, {
              number,
              speed,
              interval,
              rooms,
              dataSpace,
              // Pass the data-space attribute
              fontStyle: {
                "font-size": "inherit",
                color: "inherit"
              }
            });
          }
        }
      });
    },
    {
      threshold: 0.5,
      rootMargin: "0px 0px -50px 0px"
    }
  );
  const numberElements = document.querySelectorAll("[data-counter]");
  numberElements.forEach((element) => {
    numberObserver.observe(element);
  });
});
const forceThemeSwitcher = {
  init() {
    const html = document.documentElement;
    const forced = html.dataset.forceTheme;
    if (forced) {
      html.classList.remove("dark", "light");
      html.classList.add(forced);
      return;
    }
    const stored = localStorage.getItem("color-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    html.classList.remove("dark", "light");
    html.classList.add(theme);
  }
};
if (typeof window !== "undefined") {
  forceThemeSwitcher.init();
}
document.addEventListener("DOMContentLoaded", function() {
  const slider = document.querySelector(".slider");
  const handle = document.querySelector(".slider-handle");
  const afterImage = document.querySelector(".after");
  document.querySelector(".slider-container");
  if (!slider || !handle || !afterImage) {
    return;
  }
  let isDragging = false;
  let startX = 0;
  let startLeft = 0;
  function initSlider() {
    const sliderRect = slider.getBoundingClientRect();
    const centerPosition = sliderRect.width / 2;
    handle.style.left = `${centerPosition}px`;
    updateClipPath(centerPosition);
  }
  function updateClipPath(position) {
    const sliderRect = slider.getBoundingClientRect();
    const percentage = position / sliderRect.width * 100;
    afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
  }
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startLeft = parseInt(handle.style.left) || slider.offsetWidth / 2;
    handle.classList.add("no-transition");
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    handle.style.cursor = "ew-resize";
    handle.classList.add("active");
  });
  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      handle.classList.remove("no-transition");
      document.body.style.cursor = "default";
      document.body.style.userSelect = "";
      handle.style.cursor = "ew-resize";
      handle.classList.remove("active");
    }
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const sliderRect = slider.getBoundingClientRect();
      const deltaX = e.clientX - startX;
      const newPosition = startLeft + deltaX;
      const constrainedPosition = Math.max(0, Math.min(sliderRect.width, newPosition));
      handle.style.left = `${constrainedPosition}px`;
      updateClipPath(constrainedPosition);
      document.body.style.cursor = "ew-resize";
      handle.style.cursor = "ew-resize";
    }
  });
  handle.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.touches[0].clientX;
    startLeft = parseInt(handle.style.left) || slider.offsetWidth / 2;
    handle.classList.add("no-transition");
    handle.style.cursor = "ew-resize";
    handle.classList.add("active");
  });
  document.addEventListener("touchend", () => {
    if (isDragging) {
      isDragging = false;
      handle.classList.remove("no-transition");
      handle.style.cursor = "ew-resize";
      handle.classList.remove("active");
    }
  });
  document.addEventListener("touchmove", (e) => {
    if (isDragging) {
      e.preventDefault();
      const sliderRect = slider.getBoundingClientRect();
      const deltaX = e.touches[0].clientX - startX;
      const newPosition = startLeft + deltaX;
      const constrainedPosition = Math.max(0, Math.min(sliderRect.width, newPosition));
      handle.style.left = `${constrainedPosition}px`;
      updateClipPath(constrainedPosition);
      handle.style.cursor = "ew-resize";
    }
  });
  slider.addEventListener("click", (e) => {
    if (!isDragging) {
      const sliderRect = slider.getBoundingClientRect();
      const clickX = e.clientX - sliderRect.left;
      const constrainedPosition = Math.max(0, Math.min(sliderRect.width, clickX));
      handle.style.left = `${constrainedPosition}px`;
      updateClipPath(constrainedPosition);
    }
  });
  window.addEventListener("resize", () => {
    initSlider();
  });
  initSlider();
  handle.addEventListener("keydown", (e) => {
    const sliderRect = slider.getBoundingClientRect();
    const currentPosition = parseInt(handle.style.left) || sliderRect.width / 2;
    const step = sliderRect.width / 20;
    let newPosition = currentPosition;
    switch (e.key) {
      case "ArrowLeft":
        newPosition = Math.max(0, currentPosition - step);
        break;
      case "ArrowRight":
        newPosition = Math.min(sliderRect.width, currentPosition + step);
        break;
      case "Home":
        newPosition = 0;
        break;
      case "End":
        newPosition = sliderRect.width;
        break;
      default:
        return;
    }
    e.preventDefault();
    handle.style.left = `${newPosition}px`;
    updateClipPath(newPosition);
  });
  handle.setAttribute("tabindex", "0");
  handle.setAttribute("role", "slider");
  handle.setAttribute("aria-label", "Before and after image slider");
  handle.setAttribute("aria-valuemin", "0");
  handle.setAttribute("aria-valuemax", "100");
  handle.setAttribute("aria-valuenow", "50");
});
const leaflet = {
  init() {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      return;
    }
    const leafletMap = L.map("map").setView([39.8283, -98.5795], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      minZoom: 3
    }).addTo(leafletMap);
    window.addEventListener("resize", () => {
      leafletMap.invalidateSize();
    });
    leafletMap.zoomControl.setPosition("bottomright");
  }
};
document.addEventListener("DOMContentLoaded", () => {
  leaflet.init();
});
const themeSwitcher = {
  elements: null,
  animationConfig: { duration: 0.6, delay: 0.2, ease: "power2.out" },
  get isForcedPage() {
    return !!document.documentElement.dataset.forceTheme;
  },
  get forcedTheme() {
    return document.documentElement.dataset.forceTheme || null;
  },
  init() {
    try {
      this.cacheElements();
      this.setInitialTheme();
      this.bindEvents();
    } catch (error) {
      console.error("Theme switcher initialization failed:", error);
    }
  },
  cacheElements() {
    this.elements = {
      darkIcon: document.getElementById("dark-theme-icon"),
      lightIcon: document.getElementById("light-theme-icon"),
      toggleBtn: document.getElementById("theme-toggle"),
      html: document.documentElement
    };
  },
  setInitialTheme() {
    if (this.isForcedPage) {
      this.setTheme(this.forcedTheme, { persist: false });
      if (this.elements.toggleBtn) this.elements.toggleBtn.style.display = "none";
      return;
    }
    const storedTheme = localStorage.getItem("color-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme || (prefersDark ? "dark" : "light");
    this.setTheme(theme, { persist: false });
  },
  bindEvents() {
    const { toggleBtn } = this.elements;
    if (!toggleBtn || this.isForcedPage) return;
    toggleBtn.addEventListener("click", () => {
      const isDark = this.elements.html.classList.contains("dark");
      this.setTheme(isDark ? "light" : "dark", { persist: true });
    });
  },
  setTheme(theme, { persist = true } = {}) {
    if (!["dark", "light"].includes(theme)) return;
    const { html } = this.elements;
    html.classList.remove("dark", "light");
    html.classList.add(theme);
    if (persist && !this.isForcedPage) {
      localStorage.setItem("color-theme", theme);
    }
    this.updateIcons(theme === "dark");
  },
  updateIcons(isDark) {
    const { darkIcon, lightIcon } = this.elements;
    if (!darkIcon || !lightIcon) return;
    const showIcon = isDark ? darkIcon : lightIcon;
    const hideIcon = isDark ? lightIcon : darkIcon;
    hideIcon.classList.add("hidden");
    showIcon.classList.remove("hidden");
    gsap.fromTo(
      showIcon,
      { x: 100, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: this.animationConfig.duration,
        delay: this.animationConfig.delay,
        ease: this.animationConfig.ease
      }
    );
  }
};
if (typeof window !== "undefined") {
  themeSwitcher.init();
}
