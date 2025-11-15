import { useEffect, useState } from "react";



export function useActiveSection(ids: string[]) {
    const [active, setActive] = useState<string | null>(ids[0] ?? null);

    useEffect(() => {
        const elements = ids
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => !!el);

        if (elements.length === 0) return;

        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0]) {
                    const id = visible[0].target.id;
                    setActive(id);
                } else {
                    // Резерв: выбрать ближайшую к верху, когда ничего не пересекается
                    const byTop = entries
                        .slice()
                        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                    if (byTop) setActive(byTop.target.id);
                }
            },
            {
                root: null,
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        elements.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [ids]);

    return active;
}
