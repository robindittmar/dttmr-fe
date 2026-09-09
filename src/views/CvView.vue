<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import cvPhoto from '@/assets/cv-photo.jpg'
import CvIcon from '@/components/CvIcon.vue'

// This is a public sub-page with no link from the rest of the app, and it
// shouldn't show up in search results. index.html is shared across every
// route, so the noindex meta tag has to be added/removed here rather than
// living statically in the HTML head.
let robotsMeta: HTMLMetaElement | null = null

onMounted(() => {
  robotsMeta = document.createElement('meta')
  robotsMeta.name = 'robots'
  robotsMeta.content = 'noindex, nofollow'
  document.head.appendChild(robotsMeta)
})

onBeforeUnmount(() => {
  robotsMeta?.remove()
})

interface Project {
  title: string
  repo: string
  desc: string
  url: string
}

interface ExperienceEntry {
  company: string
  location: string
  title: string
  dates: string
  subtitle: string
  bullets: string[]
}

interface EducationEntry {
  school: string
  dates: string
  degree: string
}

interface Achievement {
  title: string
  desc: string
}

interface Language {
  name: string
  level: string
  rating: number
}

interface Skill {
  name: string
  rating: number
}

interface AdditionalExperience {
  title: string
  desc: string
}

const SKILL_MAX = 8
const LANGUAGE_MAX = 5

const projects: Project[] = [
  {
    title: 'Frontend',
    repo: 'dttmr-fe',
    desc: 'Offline-first PWA for shared, syncable to-do lists and tracking workouts. Vue 3 + TypeScript.',
    url: 'https://git.dittmar.dev/robin/dttmr-fe',
  },
  {
    title: 'API',
    repo: 'dttmr-api',
    desc: 'Go backend powering auth and sync for the to-do list/workout tracking app.',
    url: 'https://git.dittmar.dev/robin/dttmr-api',
  },
]

const experience: ExperienceEntry[] = [
  {
    company: 'Greenbone AG',
    location: 'Remote, Germany',
    title: 'Senior C Software Engineer',
    dates: '08/2025 - Present',
    subtitle: 'Open-Source Vulnerability Management',
    bullets: [
      "Improved vulnerability management for customers and community users by working on open- and closed-source projects like 'gvmd', 'gsad', and 'gsa'.",
      'Maintain old legacy systems in C, as well as building new components in Rust, which align with the ecosystem.',
      'Improve GitHub Actions CI/CD pipelines.',
    ],
  },
  {
    company: 'Aspen Technology',
    location: 'Cologne, Germany',
    title: 'Sr Software Developer',
    dates: '04/2025 - 07/2025',
    subtitle: 'Asset Optimization Software',
    bullets: [
      'Maintenance work and feature development for "inmation" Backend, a scalable solution for asset optimization.',
    ],
  },
  {
    company: 'Ubisoft',
    location: 'Düsseldorf, Germany',
    title: 'Programmer',
    dates: '10/2020 - 07/2024',
    subtitle: 'AAA Game Developer/Publisher',
    bullets: [
      'Designed and implemented new backend services, resulting in less development time for business features.',
      'Overseen the architecture and deployment of software solutions handling over 600k concurrent users.',
      'Reduced processing time by 30% by optimizing database queries and scripts.',
      'Improved system stability by 10%, resulting in increased user engagement and satisfaction.',
      'Enhanced C++ Backend functionality, resulting in a 5% decrease in response times.',
    ],
  },
  {
    company: '11880 Internet Services AG',
    location: 'Essen, Germany',
    title: 'C++ Developer',
    dates: '06/2018 - 09/2020',
    subtitle: '11880.com Information Portal',
    bullets: [
      'Maintained and developed new features of an in-memory search engine written in C++.',
      'Lifting on-premises services to the cloud, resulting in 30% more uptime and reduced costs.',
    ],
  },
  {
    company: 'Fluxatron Softec GmbH',
    location: 'Oberhausen, Germany',
    title: 'Software Developer Working Student',
    dates: '03/2016 - 09/2017',
    subtitle: 'Software Startup',
    bullets: [
      'Implement and design add-ons for Dynamics AX 365 for Business and Operations using X++.',
      'Enabled operational efficiency by reducing feature deployment time by 20% through end-to-end feature implementation collaboration.',
    ],
  },
]

const education: EducationEntry[] = [
  {
    school: 'Hochschule Ruhr West University of Applied Sciences',
    dates: '10/2015 - 05/2018',
    degree: 'Applied Informatics (no degree)',
  },
  {
    school: 'Hans-Sachs Berufskolleg',
    dates: '08/2012 - 06/2015',
    degree: 'Fachabitur + Informationstechnischer Assistent',
  },
]

const achievements: Achievement[] = [
  {
    title: 'Design New Services',
    desc: 'Successfully implemented two new services within three months.',
  },
  {
    title: 'Server Optimization Success',
    desc: 'Reduced server downtime by 10% by optimizing code.',
  },
  {
    title: 'Performance Enhancement Achievement',
    desc: 'Improved application performance by 50% through code refactoring.',
  },
]

const languages: Language[] = [
  { name: 'German', level: 'Native', rating: 5 },
  { name: 'English', level: 'Proficient', rating: 4 },
  { name: 'Spanish', level: 'Beginner', rating: 1 },
]

const interests: string[] = [
  'Software Development',
  'Linux',
  'Open Source',
  'Raspberry Pi',
  'Rock climbing',
  'Calisthenics',
]

const skills: Skill[] = [
  { name: 'Golang', rating: 5 },
  { name: 'C++17', rating: 8 },
  { name: 'C++20', rating: 5 },
  { name: 'C++ STL', rating: 7 },
  { name: 'C++ boost', rating: 4 },
  { name: 'C++ POCO', rating: 4 },
  { name: 'C (C89 to C11)', rating: 7 },
  { name: 'SQL', rating: 5 },
  { name: 'TypeScript', rating: 5 },
  { name: 'Docker', rating: 6 },
  { name: 'Linux', rating: 7 },
  { name: 'git', rating: 7 },
  { name: 'HTTP/REST', rating: 7 },
  { name: 'Amazon Web Services (AWS)', rating: 4 },
  { name: 'Node.js', rating: 4 },
  { name: 'Vue.js', rating: 5 },
  { name: 'CMake', rating: 5 },
  { name: 'MongoDB', rating: 4 },
  { name: 'Python', rating: 6 },
  { name: 'Rust', rating: 4 },
  { name: 'C#', rating: 3 },
  { name: 'ELK stack', rating: 3 },
  { name: 'DevOps', rating: 5 },
  { name: 'CI/CD with gitlab/jenkins', rating: 6 },
  { name: 'GitHub Actions', rating: 6 },
  { name: 'Jetbrains IDEs', rating: 7 },
  { name: 'VSCode', rating: 5 },
  { name: 'Visual Studio', rating: 5 },
  { name: 'vim/neovim', rating: 5 },
  { name: 'MS Windows', rating: 5 },
  { name: 'perf', rating: 5 },
  { name: 'valgrind', rating: 4 },
  { name: 'C++ SFML', rating: 6 },
  { name: 'OpenGL', rating: 4 },
  { name: 'Vulkan', rating: 2 },
  { name: 'DirectX', rating: 2 },
  { name: 'HTML5/CSS3', rating: 4 },
  { name: 'Claude Code', rating: 4 },
]

const additionalExperiences: AdditionalExperience[] = [
  {
    title: 'Minecraft Mod',
    desc: 'Around 2012 I have developed and published the "Blood Mod" for Minecraft. The mod was pretty popular at the time, being downloaded thousands of times.',
  },
  {
    title: 'Buy script generator',
    desc: 'Around 2013, I have developed a tool to generate so-called "buy scripts" for Counter-Strike. This was my first experience creating C++ GUI applications, using the Win32 API.',
  },
  {
    title: 'Small 2D games',
    desc: 'Around 2014-2015 I became interested in game development and have created a few simple 2D games using C++ and SFML.',
  },
  {
    title: 'Self-hosted services',
    desc: 'For years, I have been hosting my own git and password manager at home, utilizing a Raspberry Pi with Docker. In addition, I have a VPS with nginx and WireGuard, for access from anywhere around the world.',
  },
]
</script>

<template>
  <main class="page cv-page">
    <div class="profile-top">
      <img class="avatar" :src="cvPhoto" alt="Portrait of Robin Dittmar" />
      <div>
        <h1>Robin Dittmar</h1>
        <span class="role-badge">Software Developer</span>
      </div>
    </div>
    <div class="ledger-rule" aria-hidden="true"></div>

    <section class="card info-card contact-card">
      <h4>Contacts</h4>
      <p class="row">
        <span class="row-label"><CvIcon name="phone" />Phone</span>
        <a class="mono-num" href="tel:+4915901668799">+49 1590 1668799</a>
      </p>
      <p class="row">
        <span class="row-label"><CvIcon name="email" />Email</span>
        <a href="mailto:robindittmar@gmail.com">robindittmar@gmail.com</a>
      </p>
      <p class="row">
        <span class="row-label"><CvIcon name="location" />Location</span>
        <strong>Düsseldorf</strong>
      </p>
      <p class="row">
        <span class="row-label"><CvIcon name="linkedin" />LinkedIn</span>
        <a href="https://www.linkedin.com/in/robin-dittmar-948424310/" target="_blank" rel="noopener"
          >robin-dittmar</a
        >
      </p>
      <p class="row">
        <span class="row-label"><CvIcon name="github" />GitHub</span>
        <a href="https://github.com/rdttmr" target="_blank" rel="noopener">rdttmr</a>
      </p>
    </section>

    <h1 class="section-heading"><CvIcon name="code" />Check Out My Work</h1>
    <ul class="cards">
      <li v-for="project in projects" :key="project.repo">
        <a class="card project-card" :href="project.url" target="_blank" rel="noopener">
          <span class="project-icon"><CvIcon name="code" /></span>
          <span class="project-body">
            <span class="project-title">
              {{ project.title }}
              <span class="mono-num project-repo">{{ project.repo }}</span>
            </span>
            <span class="project-desc">{{ project.desc }}</span>
          </span>
        </a>
      </li>
    </ul>

    <h1 class="section-heading"><CvIcon name="summary" />Summary</h1>
    <section class="card info-card">
      <p class="summary-text">
        Passionate Software Developer professional with over 8 years of experience in backend
        development and software architecture. Expert in C++, strong TypeScript skills, seasoned
        Python experience and aspiring Go professional. My key achievements include designing and
        implementing new backend services resulting in reduced development time, and optimizing
        systems to handle over 600k concurrent users.
      </p>
    </section>

    <h1 class="section-heading"><CvIcon name="experience" />Experience</h1>
    <ul class="cards timeline timeline-current">
      <li v-for="job in experience" :key="job.company + job.dates">
        <article class="card job-card">
          <div class="job-card-head">
            <h3>{{ job.company }}</h3>
            <span class="mono-num job-dates">{{ job.dates }}</span>
          </div>
          <p class="job-title">{{ job.title }} · {{ job.location }}</p>
          <p class="job-subtitle">{{ job.subtitle }}</p>
          <ul class="job-bullets">
            <li v-for="(bullet, idx) in job.bullets" :key="idx">{{ bullet }}</li>
          </ul>
        </article>
      </li>
    </ul>

    <h1 class="section-heading"><CvIcon name="education" />Education</h1>
    <ul class="cards timeline">
      <li v-for="edu in education" :key="edu.school">
        <article class="card job-card">
          <div class="job-card-head">
            <h3>{{ edu.school }}</h3>
            <span class="mono-num job-dates">{{ edu.dates }}</span>
          </div>
          <p class="job-subtitle">{{ edu.degree }}</p>
        </article>
      </li>
    </ul>

    <h1 class="section-heading"><CvIcon name="achievements" />Key Achievements</h1>
    <section class="card info-card">
      <div v-for="item in achievements" :key="item.title" class="achievement-row">
        <span class="achv-icon"><CvIcon name="verified" /></span>
        <div>
          <h4>{{ item.title }}</h4>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <h1 class="section-heading"><CvIcon name="languages" />Languages</h1>
    <section class="card info-card">
      <div v-for="lang in languages" :key="lang.name" class="rating-row">
        <p class="row">
          <span>{{ lang.name }}</span>
          <span class="tag">{{ lang.level }}</span>
        </p>
        <div class="tally tally-lg">
          <span
            v-for="n in LANGUAGE_MAX"
            :key="n"
            class="tally-tick"
            :class="{ filled: n <= lang.rating }"
          ></span>
        </div>
      </div>
    </section>

    <h1 class="section-heading"><CvIcon name="skills" />Industry Experience</h1>
    <section class="card info-card">
      <div class="skill-grid">
        <div v-for="skill in skills" :key="skill.name" class="skill-row">
          <span class="skill-name">{{ skill.name }}</span>
          <div class="tally">
            <span
              v-for="n in SKILL_MAX"
              :key="n"
              class="tally-tick"
              :class="{ filled: n <= skill.rating }"
            ></span>
          </div>
        </div>
      </div>
    </section>

    <h1 class="section-heading"><CvIcon name="additional" />Additional Experience</h1>
    <ul class="cards">
      <li v-for="item in additionalExperiences" :key="item.title">
        <article class="card job-card">
          <h3>{{ item.title }}</h3>
          <p class="job-subtitle">{{ item.desc }}</p>
        </article>
      </li>
    </ul>

    <h1 class="section-heading"><CvIcon name="interests" />Interests</h1>
    <section class="card info-card">
      <div class="tags">
        <span v-for="interest in interests" :key="interest" class="tag">{{ interest }}</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.cv-page {
  padding-bottom: 2.5rem;
}

@media (min-width: 768px) {
  .cv-page {
    max-width: 780px;
  }
}

.cv-page > h1:first-child {
  font-size: 1.35rem;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 1rem;
}

.profile-top h1 {
  font-size: 1.4rem;
  margin-bottom: 0.45rem;
  letter-spacing: 0.01em;
}

.avatar {
  display: block;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.role-badge {
  display: inline-flex;
  padding: 0.22rem 0.65rem;
  border-radius: 3px;
  background: var(--c-accent-bg);
  color: var(--c-accent-strong);
  font-size: 0.78rem;
  font-weight: 500;
}

.ledger-rule {
  height: 4px;
  margin-bottom: 1.5rem;
  border-top: 1.5px solid var(--c-border-hover);
  border-bottom: 1px dashed var(--c-border);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.08rem;
  font-weight: 600;
  margin: 2rem 0 0.85rem;
}

.section-heading::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--c-border);
  margin-left: 0.35rem;
}

.section-heading .cv-icon {
  font-size: 0.85rem;
  color: var(--c-accent-strong);
}

.card {
  border-radius: 4px;
  box-shadow: none;
}

.info-card {
  padding: 1rem 1.1rem;
}

.info-card h4 {
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.contact-card {
  border-color: var(--c-accent-soft);
  box-shadow: 0 10px 28px rgba(61, 114, 180, 0.22);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  color: var(--c-text);
}

.row:last-child {
  margin-bottom: 0;
}

.info-card > .row {
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px dashed var(--c-border);
}

.info-card > .row:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.row strong {
  color: var(--c-heading);
}

.row-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.row-label .cv-icon {
  color: var(--c-text-soft);
}

.row a {
  color: var(--c-accent-strong);
}

.summary-text {
  font-size: 0.88rem;
  color: var(--c-text);
}

.achievement-row {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
}

.achievement-row + .achievement-row {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--c-border);
}

.achv-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
  border-radius: 50%;
  background: var(--c-accent-bg);
  color: var(--c-accent-strong);
  font-size: 0.9rem;
}

.achievement-row h4 {
  font-size: 0.85rem;
  color: var(--c-heading);
  margin-bottom: 0.15rem;
}

.achievement-row p {
  font-size: 0.82rem;
  color: var(--c-text-soft);
}

.rating-row + .rating-row {
  margin-top: 0.85rem;
}

/* rating tallies */
.tally {
  display: flex;
  gap: 3px;
}

.tally-tick {
  flex: 1;
  height: 6px;
  border-radius: 1px;
  background: var(--c-bg-mute);
}

.tally-tick.filled {
  background: var(--c-accent);
}

.tally-lg {
  max-width: 82%;
}

.tally-lg .tally-tick {
  height: 7px;
}

/* cards list (experience / education / additional experience) */
.cards {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* timeline (experience / education): a real chronological record, so the
   rail + nodes carry meaning rather than decorate */
.timeline {
  position: relative;
  gap: 0.9rem;
  padding-left: 1.1rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0.6rem;
  bottom: 0.6rem;
  width: 1px;
  background: var(--c-border-hover);
}

.timeline > li {
  position: relative;
}

.timeline > li::before {
  content: '';
  position: absolute;
  left: -1.1rem;
  top: 1.1rem;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-bg);
  border: 1.5px solid var(--c-text-soft);
}

.timeline-current > li:first-child::before {
  border-color: var(--c-accent-strong);
  background: var(--c-accent-strong);
  box-shadow: 0 0 0 3px var(--c-accent-bg);
}

.job-card {
  padding: 0.9rem 1.1rem;
}

.job-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.job-card-head h3 {
  font-size: 1.02rem;
}

.job-dates {
  font-size: 0.75rem;
  color: var(--c-text-soft);
  white-space: nowrap;
}

.job-title {
  font-size: 0.85rem;
  color: var(--c-text);
  margin-top: 0.15rem;
}

.job-subtitle {
  font-size: 0.82rem;
  font-style: italic;
  color: var(--c-text-soft);
  margin-top: 0.3rem;
}

.job-bullets {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--c-text);
}

.job-bullets li {
  position: relative;
  padding-left: 0.9rem;
}

.job-bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-accent);
}

/* project links */
.project-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--c-accent-soft);
  transition:
    transform 0.15s ease-in-out,
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.project-card:hover,
.project-card:focus-visible {
  border-color: var(--c-accent-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.project-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--c-accent-bg);
  color: var(--c-accent-strong);
  font-size: 1.1rem;
}

.project-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.project-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--c-heading);
  font-size: 0.95rem;
}

.project-repo {
  font-size: 0.75rem;
  color: var(--c-accent-strong);
}

.project-desc {
  font-size: 0.82rem;
  color: var(--c-text-soft);
}

/* skills */
.skill-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.7rem;
}

@media (min-width: 560px) {
  .skill-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem 1.5rem;
  }
}

.skill-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.skill-name {
  font-size: 0.82rem;
  color: var(--c-text);
}

/* tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background-color: var(--c-bg-mute);
  color: var(--c-text-soft);
}
</style>
