import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import HeroSection from './HeroSection';
import ReassuranceStrip from './ReassuranceStrip';
import FeatureProduct from './FeatureProduct';
import HowItWorks from './HowItWorks';
import BenefitsGrid from './BenefitsGrid';
import MineralComposition from './MineralComposition';
import SocialProof from './SocialProof';
import VideoReels from './VideoReels';
import EducationSection from './EducationSection';
import CommunityCallout from './CommunityCallout';
import Footer from './Footer';
import './index.css';

function Root() {
  return (
    <div className="min-h-screen bg-[#0a0015]">
      <AnnouncementBar />
      <Header />
      <main>
        <HeroSection />
        <ReassuranceStrip />
        <FeatureProduct />
        <HowItWorks />
        <BenefitsGrid />
        <MineralComposition />
        <SocialProof />
        <VideoReels />
        <EducationSection />
        <CommunityCallout />
      </main>
      <Footer />
    </div>
  );
}

export default Root;
