import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabsItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

export interface TabsProps {
  items: TabsItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export interface TabsRef {
  scrollToTab: (key: string) => void;
}

const Tabs = React.forwardRef<TabsRef, TabsProps>((
  { items, defaultActiveKey, activeKey, onChange, className },
  ref
) => {
  const [internalActiveKey, setInternalActiveKey] = useState(
    activeKey ?? defaultActiveKey ?? items[0]?.key
  );
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const currentActiveKey = activeKey ?? internalActiveKey;

  useEffect(() => {
    const updateAll = () => {
      const activeTab = tabRefs.current[currentActiveKey];
      if (activeTab && tabsRef.current) {
        const containerRect = tabsRef.current.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
      if (tabsContainerRef.current && tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    updateAll();
    window.addEventListener('resize', updateAll);
    return () => {
      window.removeEventListener('resize', updateAll);
    };
  }, [currentActiveKey, items]);

  useEffect(() => {
    const activeTab = tabRefs.current[currentActiveKey];
    if (activeTab && tabsContainerRef.current) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [currentActiveKey]);

  const handleTabClick = (key: string) => {
    if (activeKey === undefined) {
      setInternalActiveKey(key);
    }
    onChange?.(key);
  };

  const updateScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  React.useImperativeHandle(ref, () => ({
    scrollToTab: (key: string) => {
      const tab = tabRefs.current[key];
      if (tab) {
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    },
  }));

  const activeItem = items.find(item => item.key === currentActiveKey);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex items-center border-b border-neutral-200 dark:border-neutral-700">
        {showLeftArrow && (
          <button
            type="button"
            className="absolute left-0 z-10 flex h-10 w-8 items-center justify-center bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            onClick={() => scroll('left')}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div
          ref={tabsContainerRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          onScroll={updateScrollButtons}
        >
          <div ref={tabsRef} className="relative flex min-w-max">
            {items.map((item) => (
              <button
                key={item.key}
                ref={(el) => { tabRefs.current[item.key] = el; }}
                type="button"
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                  currentActiveKey === item.key
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
                onClick={() => handleTabClick(item.key)}
              >
                {item.label}
              </button>
            ))}
            <div
              className="absolute bottom-0 h-0.5 bg-primary-500 dark:bg-primary-400 transition-all duration-300 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          </div>
        </div>

        {showRightArrow && (
          <button
            type="button"
            className="absolute right-0 z-10 flex h-10 w-8 items-center justify-center bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            onClick={() => scroll('right')}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <div className="pt-4">
        {activeItem && activeItem.children}
      </div>
    </div>
  );
});

Tabs.displayName = 'Tabs';

export default Tabs;
