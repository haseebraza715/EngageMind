import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button, { ButtonGroup } from '../components/UI/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '../components/UI/Card';
import Input, { SearchInput } from '../components/UI/Input';
import Modal, { ConfirmDialog } from '../components/UI/Modal';
import Dropdown, { DropdownItem, DropdownDivider, DropdownHeader } from '../components/UI/Dropdown';
import { useToast } from '../components/UI/Toast';
import Tabs from '../components/UI/Tabs';
import Accordion from '../components/UI/Accordion';
import Progress, { CircularProgress } from '../components/UI/Progress';
import { SkeletonList } from '../components/UI/Skeleton';
import Breadcrumb from '../components/UI/Breadcrumb';
import { SimplePagination } from '../components/UI/Pagination';
import DarkModeToggle from '../components/UI/DarkModeToggle';

const Section = ({ title, children, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`glass-panel rounded-2xl p-8 ${className}`}
    >
        <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white flex items-center gap-3">
            {title}
        </h2>
        <div className="space-y-6">
            {children}
        </div>
    </motion.div>
);

const ComponentShowcase = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const toast = useToast();

    const breadcrumbItems = [
        { label: 'System', href: '/' },
        { label: 'Components', href: '/components' },
        { label: 'Showcase' },
    ];

    const tabs = [
        { label: 'Design', content: <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg mt-2">Design system tokens and values.</div> },
        { label: 'Code', content: <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg mt-2">React component usage examples.</div> },
        { label: 'Accessibility', content: <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg mt-2">WCAG 2.1 AA compliance notes.</div> },
    ];

    const accordionItems = [
        { title: 'Interactive Elements', content: 'Buttons, inputs, and controls designed for touch and mouse.' },
        { title: 'Layout Primitives', content: 'Grid, flex, and container utilities for responsive design.' },
        { title: 'Animation Tokens', content: 'Framer motion presets for consistent motion language.' },
    ];

    return (
        <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#0b1220] transition-colors duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[#0b1220] text-white py-24 lg:py-32">
                <div className="absolute inset-0 bg-brand-gradient opacity-90" />
                <div className="absolute inset-0 opacity-25 mesh-gradient blur-3xl" />
                <div className="container-custom relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-2 text-primary-400 font-medium mb-4">
                                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                                EngageMind Design System v2.0
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                                UI <span className="gradient-text">Components</span>
                            </h1>
                            <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed text-balance">
                                A comprehensive collection of professionally crafted, accessible, and animateable React components built on Tailwind CSS.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-4">
                            <DarkModeToggle />
                            <p className="text-sm text-neutral-500">Toggle Theme</p>
                        </div>
                    </div>

                    <Breadcrumb items={breadcrumbItems} className="text-neutral-400" />
                </div>
            </div>

            <div className="container-custom py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* BUTTONS */}
                        <Section title="Button Variants">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Primary Actions</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <Button variant="primary">Primary Action</Button>
                                        <Button variant="primary" icon>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </Button>
                                        <Button variant="primary" loading>Loading</Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Secondary Actions</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <Button variant="secondary">Secondary</Button>
                                        <Button variant="accent">Accent</Button>
                                        <Button variant="outline">Outline</Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Utility</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <Button variant="ghost">Ghost Button</Button>
                                        <Button variant="danger">Destructive</Button>
                                        <Button variant="glass">Glass</Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Groups & Icons</h3>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <ButtonGroup>
                                            <Button variant="outline" size="sm">Year</Button>
                                            <Button variant="outline" size="sm">Month</Button>
                                            <Button variant="outline" size="sm">Day</Button>
                                        </ButtonGroup>

                                        <Button variant="secondary" size="sm" rightIcon={<span>→</span>}>Continue</Button>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* INPUTS */}
                        <Section title="Form Inputs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Email Address" placeholder="alex@example.com" leftIcon={
                                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                } />
                                <Input label="Secure Password" type="password" placeholder="••••••••" />
                                <Input label="With Floating Label" floating placeholder="Username" />
                                <Input label="Error State" error="Something went wrong" defaultValue="Invalid Value" />
                                <div className="md:col-span-2">
                                    <SearchInput placeholder="Search global resources..." onSearch={(val) => toast.info(`Searching: ${val}`)} />
                                </div>
                            </div>
                        </Section>

                        {/* FEEDBACK & OVERLAYS */}
                        <Section title="Feedback & Overlays">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Toasts</h3>
                                    <div className="flex flex-col gap-3">
                                        <Button variant="secondary" onClick={() => toast.success('Changes saved successfully')}>Show Success Toast</Button>
                                        <Button variant="outline" onClick={() => toast.error('Connection failed, retrying...')}>Show Error Toast</Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Modals</h3>
                                    <div className="flex gap-3">
                                        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                                        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="System Notification" footer={
                                            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button><Button onClick={() => setIsModalOpen(false)}>Understood</Button></div>
                                        }>
                                            <p className="text-neutral-600 dark:text-neutral-300">This is a highly flexible modal component that supports varied content sizes, backdrops, and animations.</p>
                                        </Modal>

                                        <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>Delete</Button>
                                        <ConfirmDialog
                                            isOpen={isConfirmOpen}
                                            onClose={() => setIsConfirmOpen(false)}
                                            onConfirm={() => { toast.success('Item deleted'); setIsConfirmOpen(false); }}
                                            title="Delete Resource?"
                                            message="This action cannot be undone. Are you sure you want to proceed?"
                                            variant="danger"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Navigation & Structure">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="mb-4 font-medium">Tabs</h3>
                                    <Tabs tabs={tabs} variant="underline" />
                                </div>
                                <div>
                                    <h3 className="mb-4 font-medium">Accordion</h3>
                                    <Accordion items={accordionItems} />
                                </div>
                            </div>
                        </Section>

                    </div>

                    {/* Sidebar / Sticky Column */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                        {/* CARDS */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="font-bold mb-4">Cards</h3>
                            <div className="space-y-4">
                                <Card hover>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Stats Overview</CardTitle>
                                    </CardHeader>
                                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-teal-400">
                                        $84,232
                                    </div>
                                    <CardFooter className="text-sm text-green-500 flex items-center gap-1">
                                        <span>+12.5%</span> <span className="text-neutral-400">vs last month</span>
                                    </CardFooter>
                                </Card>

                                <Card variant="gradient" interactive onClick={() => toast.info('Interactive Card Clicked')}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Premium Plan</CardTitle>
                                        <CardDescription>Unlock full potential</CardDescription>
                                    </CardHeader>
                                </Card>
                            </div>
                        </div>

                        {/* DATA */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="font-bold mb-4">Data Display</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span>Storage</span><span>75%</span></div>
                                    <Progress value={75} variant="primary" />
                                </div>

                                <div className="flex items-center gap-6 justify-center">
                                    <CircularProgress value={62} size={80} showValue variant="accent" />
                                    <div className="text-sm text-neutral-500">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-200">System Load</p>
                                        <p>Optimal range</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MENU */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="font-bold mb-4">Menus</h3>
                            <Dropdown
                                trigger={<Button variant="outline" className="w-full justify-between" rightIcon={<span>▼</span>}>Account Actions</Button>}
                                className="w-full"
                            >
                                <DropdownHeader>My Account</DropdownHeader>
                                <DropdownItem icon="👤">Profile</DropdownItem>
                                <DropdownItem icon="⚙️">Settings</DropdownItem>
                                <DropdownDivider />
                                <DropdownItem icon="🚪" danger>Log Out</DropdownItem>
                            </Dropdown>
                        </div>

                        {/* SKELETON */}
                        <div className="glass-panel rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold">Loading States</h3>
                                <Button size="sm" variant="ghost" onClick={() => setShowSkeleton(!showSkeleton)}>Toggle</Button>
                            </div>
                            {showSkeleton ? (
                                <SkeletonList count={3} />
                            ) : (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-lg">👤</div>
                                            <div>
                                                <div className="text-sm font-medium">User {i}</div>
                                                <div className="text-xs text-neutral-500">Active now</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PAGINATION */}
                        <div className="glass-panel rounded-2xl p-6">
                            <SimplePagination currentPage={currentPage} totalPages={10} onPageChange={setCurrentPage} />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComponentShowcase;
