import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfig } from "@/contexts/ConfigContext";
import { useAuth } from "@/contexts/AuthContext";
import { AnimateOnScroll } from "@/hooks/use-scroll-animation";
import { MediaRenderer } from "@/components/MediaRenderer";
import {
  ArrowRight,
  Users,
  Award,
  FlaskConical,
  Building2,
  ChevronRight,
  ChevronDown,
  Star,
  Heart,
  Stethoscope,
  Clock,
  Shield,
  ClipboardCheck,
  ShieldCheck,
  Pill,
  Dna,
  Accessibility,
  NotebookPen,
  Quote,
} from "lucide-react";

export default function Home() {
  const { config } = useConfig();
  const { isAuthenticated, user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeDept, setActiveDept] = useState(0);

  const heroMediaUrl = config.heroMediaUrl || config.heroBackgroundUrl;

  const getDashboardPath = () => {
    if (!user) return "/register";
    switch (user.userLevel) {
      case 1: return "/dashboard/applicant";
      case 2: return "/dashboard/reviewer";
      case 3: return "/dashboard/agent";
      case 4: return "/dashboard/admin";
      case 5: return "/dashboard/owner";
      default: return "/";
    }
  };

  const services = [
    { icon: Accessibility, title: "Temporary Handicap Placard", description: "For short-term disabilities or recovery from surgery. Valid for up to 6 months with medical certification from a licensed provider." },
    { icon: Shield, title: "Permanent Disability Placard", description: "For individuals with long-term mobility impairments. Reviewed and certified by licensed medical professionals." },
    { icon: Stethoscope, title: "Medical Certification Form", description: "Licensed physicians complete the required medical certification verifying your qualifying disability condition." },
    { icon: Heart, title: "Placard Renewal Service", description: "Hassle-free renewal of your existing handicap parking permit with updated medical documentation." },
    { icon: ClipboardCheck, title: "Disabled License Plates", description: "Assistance with applying for permanent disabled person license plates through your state's DMV process." },
    { icon: NotebookPen, title: "Priority Processing", description: "Expedited processing for urgent handicap permit needs, including same-day medical review availability." },
  ];

  const stats = [
    { icon: Users, value: "10,000+", label: "Permits Processed" },
    { icon: Building2, value: "24hr", label: "Processing Time" },
    { icon: FlaskConical, value: "100%", label: "State Compliant" },
    { icon: Award, value: "4.9/5", label: "Customer Rating" },
  ];

  const defaultDeptImages = [
    "/images/parking/dept-1.jpg",
    "/images/parking/dept-2.jpg",
    "/images/parking/dept-3.jpg",
    "/images/parking/dept-4.jpg",
    "/images/parking/dept-5.jpg",
  ];
  const deptMedia = config.departmentMediaUrls || [];

  const departments = [
    { name: "Temporary Placards", img: deptMedia[0] || defaultDeptImages[0], desc: "Short-term handicap parking placards for temporary disabilities, post-surgery recovery, or injury rehabilitation. Typically valid for up to 6 months." },
    { name: "Permanent Permits", img: deptMedia[1] || defaultDeptImages[1], desc: "Permanent disabled parking permits for individuals with qualifying long-term mobility impairments, reviewed and certified by licensed physicians." },
    { name: "Medical Certification", img: deptMedia[2] || defaultDeptImages[2], desc: "Our network of licensed medical professionals provides the required medical certification forms needed for your handicap permit application." },
    { name: "Permit Renewals", img: deptMedia[3] || defaultDeptImages[3], desc: "Streamlined renewal process for existing handicap parking permits. We handle the medical re-certification and paperwork for you." },
    { name: "Priority Processing", img: deptMedia[4] || defaultDeptImages[4], desc: "Expedited processing for urgent permit needs. Get your medical certification and application completed within hours." },
  ];

  const faqs = [
    { q: "How quickly will I receive my handicap parking permit?", a: "Most applications are processed within 24 hours. Our priority service can deliver medical certifications even faster for urgent needs." },
    { q: "What conditions qualify for a handicap parking permit?", a: "Qualifying conditions include mobility impairments, use of assistive devices, heart or lung conditions that limit walking, and other disabilities. A licensed physician will evaluate your eligibility." },
    { q: "Is my personal and medical information kept confidential?", a: "Absolutely. We use HIPAA-compliant encryption and never share your personal or medical information with third parties. Your privacy is our top priority." },
    { q: "What types of handicap permits do you help with?", a: "We assist with temporary placards, permanent disability placards, disabled person license plates, permit renewals, and medical certification forms." },
    { q: "Can I get a refund if my application is denied?", a: "Yes, if a licensed physician determines you do not meet the medical criteria, you are eligible for a refund. Contact our support team for assistance." },
    { q: "What do I need to get started?", a: "Simply create an account and provide basic information about yourself and your condition. A licensed medical professional will review your application and complete the required certification." },
  ];

  const defaultTestimonialImages = [
    "/images/parking/testimonial-1.jpg",
    "/images/parking/testimonial-2.jpg",
    "/images/parking/testimonial-3.jpg",
    "/images/parking/testimonial-4.jpg",
    "/images/parking/testimonial-5.jpg",
  ];
  const testimonialMedia = config.testimonialMediaUrls || [];

  const testimonials = [
    { name: "Sarah M.", role: "Permit Applicant", text: "Got my temporary placard within a day. The medical review was quick and the whole process was incredibly smooth and professional.", rating: 5, img: testimonialMedia[0] || defaultTestimonialImages[0] },
    { name: "James K.", role: "Permit Holder", text: "After my knee surgery, I needed a handicap placard fast. They connected me with a doctor who certified me the same day.", rating: 5, img: testimonialMedia[1] || defaultTestimonialImages[1] },
    { name: "Emily R.", role: "Caregiver", text: "Helped my elderly mother get her permanent parking permit. The process was respectful, professional, and completely confidential.", rating: 5, img: testimonialMedia[2] || defaultTestimonialImages[2] },
    { name: "Michael D.", role: "Permit Applicant", text: "Outstanding service. I needed my permit renewed urgently and they handled everything within hours. Will definitely use again.", rating: 5, img: testimonialMedia[3] || defaultTestimonialImages[3] },
    { name: "Lisa T.", role: "Permit Holder", text: "Simple process, legitimate documentation. My state DMV accepted everything without any issues. The customer service was excellent too.", rating: 5, img: testimonialMedia[4] || defaultTestimonialImages[4] },
  ];

  const defaultGalleryImages = [
    "/images/parking/gallery-1.jpg",
    "/images/parking/gallery-2.jpg",
    "/images/parking/gallery-3.jpg",
    "/images/parking/gallery-4.jpg",
    "/images/parking/gallery-5.jpg",
    "/images/parking/gallery-6.jpg",
    "/images/parking/gallery-7.jpg",
    "/images/parking/gallery-8.jpg",
  ];
  const galleryImages = config.galleryImages && config.galleryImages.length > 0
    ? config.galleryImages
    : defaultGalleryImages;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        <MediaRenderer
          url={heroMediaUrl || ""}
          fallbackUrl="/images/parking/hero.jpg"
          alt=""
          overlay
          data-testid="media-hero-background"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        <div className="container relative z-10 py-20">
          <AnimateOnScroll animation="fade-right">
            <div className="bg-primary/85 backdrop-blur-sm text-primary-foreground rounded-md p-8 md:p-12 max-w-xl shadow-xl" data-testid="hero-welcome-box">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 !text-white leading-tight">
                {config.heroTitle || `WELCOME TO ${config.siteName.toUpperCase()}`}
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-6 leading-relaxed">
                {config.heroSubtitle || "Trusted handicap parking permit services delivered quickly. Join thousands of satisfied applicants."}
              </p>
              {isAuthenticated ? (
                <Button size="lg" variant="secondary" asChild data-testid="button-hero-dashboard">
                  <Link href={getDashboardPath()}>
                    Go to Dashboard
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="secondary" asChild data-testid="button-hero-learn">
                  <Link href={config.heroButtonLink || "/packages"}>
                    {config.heroButtonText || "Learn More"}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              { icon: ClipboardCheck, title: "Licensed Physicians", desc: "All medical certifications reviewed and signed by licensed medical professionals." },
              { icon: ShieldCheck, title: "HIPAA Compliant", desc: "Your medical information is encrypted and never shared with third parties." },
              { icon: Clock, title: "Fast Processing", desc: "Receive your approved permit application within hours of submitting." },
            ].map((item, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 100}>
                <Card className="bg-background/95 backdrop-blur-sm shadow-lg border-0" data-testid={`hero-icon-box-${i}`}>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <AnimateOnScroll animation="fade-right">
              <div className="relative">
                <MediaRenderer
                  url={config.aboutMediaUrl || "/images/parking/about.jpg"}
                  alt="About our service"
                  className="rounded-md w-full shadow-lg"
                  data-testid="img-about"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary rounded-md opacity-20 -z-10" />
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-left">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-about-title">
                  About Us
                </h3>
                <div className="w-16 h-1 bg-primary rounded-full mb-6" />
                <p className="text-muted-foreground mb-8 leading-relaxed text-base">
                  We simplify the handicap parking permit application process. Our network of licensed medical professionals reviews your eligibility and completes the required medical certification forms, so you can get your permit faster.
                </p>
                <div className="space-y-6">
                  {[
                    { icon: ShieldCheck, title: "Licensed Medical Professionals", desc: "Every medical certification is reviewed and signed by a licensed physician." },
                    { icon: Clock, title: "Fast Turnaround Time", desc: "Most applications are processed within 24 hours, with priority options available." },
                    { icon: Shield, title: "HIPAA-Compliant Privacy", desc: "Your medical and personal information is encrypted and never shared with anyone." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start" data-testid={`about-item-${i}`}>
                      <div className="shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h5 className="text-base font-bold mb-1">{item.title}</h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[hsl(var(--section-bg))]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <AnimateOnScroll key={i} animation="zoom-in" delay={i * 100}>
                <div className="flex flex-col items-center" data-testid={`stat-${i}`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-3 shadow-lg relative z-10 ring-4 ring-background">
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <Card className="w-full -mt-8 pt-12 pb-6 text-center shadow-md">
                    <CardContent className="p-0">
                      <span className="text-3xl md:text-4xl font-bold block mb-1" data-testid={`text-stat-value-${i}`}>{stat.value}</span>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                    </CardContent>
                  </Card>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-24">
        <div className="container">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-medium section-title-underline" data-testid="text-services-title">
                Services
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-base">
                Professional handicap parking permit services for every situation, delivered with speed and care.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 80}>
                <div
                  className="border rounded-md p-10 text-center hover-elevate cursor-pointer shadow-sm"
                  data-testid={`card-service-${i}`}
                >
                  <div className="relative mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Order Section */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <MediaRenderer
          url={config.ctaMediaUrl || "/images/parking/cta.jpg"}
          alt=""
          overlay
          data-testid="media-cta-bg"
        />
        <div className="absolute inset-0 bg-primary/90" />
        <div className="container relative z-10">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center max-w-2xl mx-auto text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 !text-white" data-testid="text-cta-title">
                Apply for Your Handicap Permit Now
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
                Join thousands of satisfied applicants. Get your medical certification and permit application completed in just a few simple steps.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild data-testid="button-cta-start">
                  <Link href="/register">
                    Get Started Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground" asChild data-testid="button-cta-services">
                  <Link href="/packages">View Services</Link>
                </Button>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 md:py-24">
        <div className="container">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-medium section-title-underline" data-testid="text-departments-title">
                Departments
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-base">
                Explore our specialized permit services tailored to your specific needs.
              </p>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-64 shrink-0">
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {departments.map((dept, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDept(i)}
                      className={`text-left px-5 py-4 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        activeDept === i
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-[hsl(var(--section-bg))] text-foreground hover:bg-primary/10'
                      }`}
                      data-testid={`button-dept-${i}`}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{departments[activeDept].name}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base mb-6">
                      {departments[activeDept].desc}
                    </p>
                    <Button asChild data-testid="button-dept-learn-more">
                      <Link href="/packages">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden shadow-lg">
                    <MediaRenderer
                      url={departments[activeDept].img}
                      alt={departments[activeDept].name}
                      className="w-full h-full"
                      data-testid={`img-dept-${activeDept}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-24 bg-[hsl(var(--section-bg))]">
        <div className="container">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-medium section-title-underline" data-testid="text-faq-title">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-base">
                Find answers to common questions about our handicap parking permit service.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 60}>
                <div
                  className={`rounded-md overflow-hidden transition-all duration-300 shadow-sm ${openFaq === i ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background border'}`}
                  data-testid={`faq-item-${i}`}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium"
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    data-testid={`button-faq-toggle-${i}`}
                  >
                    <span className={`text-base ${openFaq === i ? '!text-white font-semibold' : ''}`}>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                    <div className="px-5 pb-5">
                      <p className={`text-sm leading-relaxed ${openFaq === i ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{faq.a}</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <AnimateOnScroll animation="fade-right" className="lg:col-span-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-testimonials-title">
                  Testimonials
                </h3>
                <div className="w-16 h-1 bg-primary rounded-full mb-6" />
                <p className="text-muted-foreground leading-relaxed text-base">
                  Hear from our satisfied customers who trust us for their handicap permit needs. We're proud to maintain a 4.9/5 rating across thousands of applications.
                </p>
              </div>
            </AnimateOnScroll>
            <div className="lg:col-span-3">
              <div className="space-y-5">
                {testimonials.map((t, i) => (
                  <AnimateOnScroll key={i} animation="fade-up" delay={i * 80}>
                    <Card className="shadow-md border-0 bg-background" data-testid={`testimonial-${i}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/20">
                            <MediaRenderer
                              url={t.img}
                              alt={t.name}
                              className="h-full w-full"
                              data-testid={`img-testimonial-${i}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                              <div>
                                <h4 className="font-bold text-base" data-testid={`text-testimonial-name-${i}`}>{t.name}</h4>
                                <p className="text-xs text-muted-foreground">{t.role}</p>
                              </div>
                              <div className="flex gap-0.5">
                                {Array(t.rating).fill(null).map((_, j) => (
                                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            <div className="relative">
                              <Quote className="absolute -top-1 -left-1 h-5 w-5 text-primary/20" />
                              <p className="text-sm text-muted-foreground italic pl-5 leading-relaxed" data-testid={`text-testimonial-${i}`}>{t.text}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 md:py-24 bg-[hsl(var(--section-bg))]">
        <div className="container">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-medium section-title-underline" data-testid="text-gallery-title">
                Gallery
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-base">
                A glimpse into our professional team and satisfied clients.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((img, i) => (
              <AnimateOnScroll key={i} animation="zoom-in" delay={i * 60}>
                <div className="group relative overflow-hidden rounded-md cursor-pointer aspect-square" data-testid={`gallery-img-${i}`}>
                  <MediaRenderer
                    url={img}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Final CTA Section */}
      <section id="contact" className="relative py-20 md:py-24 overflow-hidden">
        <MediaRenderer
          url={config.contactMediaUrl || "/images/parking/contact.jpg"}
          alt=""
          overlay
          data-testid="media-contact-bg"
        />
        <div className="absolute inset-0 bg-primary/90" />
        <div className="container relative z-10">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center max-w-2xl mx-auto text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 !text-white">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
                Create your account today and start your handicap parking permit application. Our team is available 24/7 to assist you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild data-testid="button-contact-register">
                  <Link href="/register">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground" asChild data-testid="button-contact-services">
                  <Link href="/packages">Browse Services</Link>
                </Button>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
