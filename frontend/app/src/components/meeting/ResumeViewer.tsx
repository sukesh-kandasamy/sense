
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import {
    FileText,
    GraduationCap,
    Briefcase,
    Award,
    Code,
    User,
    Link as LinkIcon,
    Puzzle,
    Loader2,
    CheckCircle,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar
} from 'lucide-react';

interface ResumeData {
    summary: string;
    personal_info: any;
    experience: any[];
    skills_soft: string[];
    skills_hard: string[];
    projects: any[];
    achievements: string[];
    certifications: string[];
    education: any[];
    links: any;
    others: any;
}

export function ResumeViewer({ candidateEmail, onBack }: { candidateEmail: string, onBack?: () => void }) {
    const [data, setData] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResumeData = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/users/${candidateEmail}/resume-data`, {
                    withCredentials: true
                });
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch resume data", err);
                setError("Resume data not available or failed to load.");
            } finally {
                setLoading(false);
            }
        };

        if (candidateEmail) {
            fetchResumeData();
        }
    }, [candidateEmail]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm">Loading resume data...</p>
            </div>
        );
    }

    if (error || !data || Object.keys(data).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-[#f8f9fa]">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400 mx-auto">
                    <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 font-medium mb-2">No Resume Data</h3>
                <p className="text-gray-500 text-sm mb-4">
                    The candidate hasn't uploaded a resume or it hasn't been parsed yet.
                </p>

                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-blue-600 font-medium text-sm hover:underline"
                    >
                        Back to Insights
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header with Back Button */}
            {onBack && (
                <div className="flex items-center gap-2 p-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                    <button
                        onClick={onBack}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
                        title="Back to Insights"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-sm font-semibold text-gray-700">Resume Details</h2>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">

                {/* 1. Summary */}
                {data.summary && (
                    <section>
                        <div className="flex items-center gap-2 mb-2 text-blue-600">
                            <User className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Summary</h3>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed bg-blue-50/30 p-3 rounded-lg border border-blue-50">
                            {data.summary}
                        </p>
                    </section>
                )}

                {/* 2. Personal Info */}
                {data.personal_info && Object.keys(data.personal_info).length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Personal Info</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {data.personal_info.name && <div className="font-semibold text-base text-gray-900">{data.personal_info.name}</div>}
                            {data.personal_info.email && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5" /> <span>{data.personal_info.email}</span>
                                </div>
                            )}
                            {data.personal_info.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-3.5 h-3.5" /> <span>{data.personal_info.phone}</span>
                                </div>
                            )}
                            {data.personal_info.location && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-3.5 h-3.5" /> <span>{data.personal_info.location}</span>
                                </div>
                            )}
                            {/* Render other fields flexibly */}
                            {Object.entries(data.personal_info)
                                .filter(([k]) => !['name', 'email', 'phone', 'location'].includes(k))
                                .map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <span className="font-medium capitalize text-gray-500 text-xs">{key.replace(/_/g, ' ')}:</span>
                                        <span>{String(value)}</span>
                                    </div>
                                ))}
                        </div>
                    </section>
                )}

                {/* 3. Experience (NEW) */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-indigo-600">
                            <Briefcase className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Experience</h3>
                        </div>
                        <div className="space-y-4">
                            {data.experience.map((job: any, i: number) => (
                                <div key={i} className="relative pl-4 border-l-2 border-indigo-100">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-200 border border-white"></div>
                                    <h4 className="font-semibold text-gray-900 text-sm">{job.job_title || job.role || "Role"}</h4>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                                        <span className="font-medium text-indigo-700">{job.company || job.organization}</span>
                                        <span>{job.duration || job.dates}</span>
                                    </div>
                                    {job.description && (
                                        <p className="text-xs text-gray-600 leading-relaxed">{job.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-orange-600">
                            <Code className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Projects</h3>
                        </div>
                        <div className="space-y-3">
                            {data.projects.map((proj: any, i: number) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-orange-200 transition-colors">
                                    <h4 className="font-medium text-gray-900 text-sm mb-1">{proj.title || "Untitled Project"}</h4>
                                    {proj.description && (
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-3">{proj.description}</p>
                                    )}
                                    {proj.tech_stack && (
                                        <div className="flex flex-wrap gap-1">
                                            {(Array.isArray(proj.tech_stack) ? proj.tech_stack : [proj.tech_stack]).map((tech: string, t: number) => (
                                                <span key={t} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-red-600">
                            <GraduationCap className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Education</h3>
                        </div>
                        <div className="space-y-2">
                            {data.education.map((edu: any, i: number) => (
                                <div key={i} className="flex flex-col bg-gray-50/50 p-2.5 rounded border border-gray-100">
                                    <h4 className="font-medium text-gray-900 text-sm">{edu.institution || edu.school}</h4>
                                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                        <span>{edu.degree || edu.qualification}</span>
                                        <span>{edu.year || edu.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {(data.skills_hard?.length > 0 || data.skills_soft?.length > 0) && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-purple-600">
                            <Puzzle className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Skills</h3>
                        </div>

                        <div className="space-y-3">
                            {data.skills_hard?.length > 0 && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block tracking-wider">Technical</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.skills_hard.map((skill, index) => (
                                            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.skills_soft?.length > 0 && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block tracking-wider">Soft Skills</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.skills_soft.map((skill, index) => (
                                            <span key={index} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs border border-purple-100">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* 6. Achievements & Certifications */}
                {(data.certifications?.length > 0 || data.achievements?.length > 0) && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-green-600">
                            <Award className="w-4 h-4" />
                            <h3 className="font-semibold text-xs uppercase tracking-wider">Achievements</h3>
                        </div>
                        <ul className="space-y-1.5">
                            {data.achievements?.map((ach, i) => (
                                <li key={`ach-${i}`} className="flex gap-2 text-xs text-gray-700">
                                    <Award className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                                    <span>{ach}</span>
                                </li>
                            ))}
                            {data.certifications?.map((cert, i) => (
                                <li key={`cert-${i}`} className="flex gap-2 text-xs text-gray-700">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                    <span>{cert}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* 7. Links & Others */}
                {(data.links || data.others) && (
                    <section className="pt-4 border-t border-gray-100">
                        {data.links && Object.keys(data.links).length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-2">Links</h3>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {Object.entries(data.links).map(([key, value]) => (
                                        <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors text-gray-600 font-medium border border-gray-200 hover:border-blue-200">
                                            <LinkIcon className="w-3 h-3" />
                                            {key.replace(/_/g, ' ')}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.others && Object.keys(data.others).length > 0 && (
                            <div>
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-2">Additional Info</h3>
                                <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-1">
                                    {Object.entries(data.others).map(([key, value]) => (
                                        <div key={key} className="flex gap-2">
                                            <span className="font-medium text-gray-900 min-w-[60px] capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span>{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
